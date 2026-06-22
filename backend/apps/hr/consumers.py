import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.hr.models import ChatGroup, Message, UnreadMessage
from django.contrib.auth import get_user_model
from django.db import close_old_connections

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        close_old_connections() 
        self.user = self.scope["user"]
        self.group_id = self.scope["url_route"]["kwargs"].get("group_id")

        if not self.group_id:
            await self.close(code=4000)
            return

        self.room_group_name = f"chat_{self.group_id}"

        if not self.user.is_authenticated:
            await self.accept()
            await self.close(code=4001)
            return

        # Join group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Mark as read + presence
        await self.mark_as_read()
        await self.broadcast_presence(action="join")

    async def disconnect(self, close_code):
        close_old_connections()
        try:
            if hasattr(self, "room_group_name"):
                await self.broadcast_presence(action="leave")
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        except Exception as e:
            print(f"[Chat] Disconnect error: {e}")
        finally:
            close_old_connections()  # Extra safety


    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type")

        if msg_type == "chat_message":
            temp_id = data.get("temp_id")
            message = await self.save_message(
                content=data.get("content", ""),
                file_url=data.get("file_url"),
                private_to=data.get("private_to", [])
            )
            if message:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "message": message,
                        "temp_id": temp_id
                    }
                )

        elif msg_type == "presence":
            # Client sends presence on connect (optional)
            await self.broadcast_presence(action=data.get("action", "join"))

    async def chat_message(self, event):
        message = event["message"]

        # Filter private messages
        if message.get("is_private"):
            recipient_ids = message.get("private_recipient_ids", [])
            if self.user.id not in recipient_ids and self.user.id != message.get("sender", {}).get("id"):
                return

        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": message,
            "temp_id": event.get("temp_id")
            # Optionally still send temp_id if you want to keep it
        }))

    async def broadcast_presence(self, action: str = "join"):
        """Broadcast online/offline status to the group"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user.presence",
                "user_id": self.user.id,
                "action": action,
            }
        )

    async def user_presence(self, event):
        """Receive presence updates from others"""
        if event["user_id"] == self.user.id:
            return  # Ignore own presence

        await self.send(text_data=json.dumps({
            "type": "presence",
            "action": event["action"],
            "user_id": event["user_id"],
        }))

    # ================= DB METHODS =================

    @database_sync_to_async
    def is_member(self):
        try:
            group = ChatGroup.objects.select_related('project', 'organization').get(id=self.group_id)

            print(f"[Chat] Checking membership for user {self.user.email} ({self.user.role}) in group '{group.name}' ({group.group_type})")

            if group.group_type == 'custom':
                is_member = group.manual_members.filter(id=self.user.id).exists()
                print(f"[Chat] Custom group → member: {is_member}")
                return is_member

            elif group.group_type == 'project' and group.project:
                # Correct way: Check if the user's linked Employee is in project.members
                is_member = group.project.members.filter(user=self.user).exists()
                print(f"[Chat] Project group → member: {is_member}")
                return is_member

            elif group.group_type == 'organization' and group.organization:
                is_member = group.organization.employees.filter(user=self.user).exists()
                print(f"[Chat] Organization group → member: {is_member}")
                return is_member

            print(f"[Chat] Unknown group_type '{group.group_type}' → rejecting")
            return False

        except ChatGroup.DoesNotExist:
            print(f"[Chat] Group ID {self.group_id} does not exist")
            return False
        except Exception as e:
            print(f"[Chat] Unexpected error in is_member: {e}")
            return False

    @database_sync_to_async
    def save_message(self, content: str, file_url: str | None, private_to: list):
        try:
            group = ChatGroup.objects.get(id=self.group_id)

            content = (content or "").strip()

            message = Message.objects.create(
                group=group,
                sender=self.user,
                content=content,
                file=file_url,
                is_private=bool(private_to),
            )

            if private_to:
                message.private_recipients.set(private_to)

            # Unread messages for others
            members = group.get_members().exclude(id=self.user.id)
            unread_objs = []
            for member in members:
                if message.is_private and member.id not in private_to:
                    continue
                unread_objs.append(UnreadMessage(user=member, message=message, group=group))

            if unread_objs:
                UnreadMessage.objects.bulk_create(unread_objs, ignore_conflicts=True)

            # === CRITICAL: Full sender object for frontend ===
            employee = getattr(self.user, "employee", None)

            response_data = {
                "id": message.id,
                "content": message.content,
                "file_url": file_url if file_url else None,
                "timestamp": message.timestamp.isoformat(),
                "is_private": message.is_private,
                "private_recipient_ids": list(message.private_recipients.values_list("id", flat=True)),
                
                # Full sender object (this is what frontend expects)
                "sender": {
                    "id": self.user.id,
                    "full_name": employee.full_name if employee else self.user.get_full_name() or self.user.email,
                    "email": self.user.email,
                    "photo": employee.photo.url if employee and hasattr(employee, 'photo') and employee.photo else None,
                }
            }

            print(f"[Chat] Message broadcasted with full sender: {response_data['sender']}")
            return response_data

        except Exception as e:
            print(f"[Chat] FAILED to save message: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return None

    @database_sync_to_async
    def mark_as_read(self):
        UnreadMessage.objects.filter(
            user=self.user,
            group_id=self.group_id
        ).delete()