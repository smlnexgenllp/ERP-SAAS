from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes,action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.hr.models import ChatGroup, Message, UnreadMessage,Project,Designation
from apps.hr.serializers import ChatGroupSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from ..utils import get_project_members
from apps.organizations.models import OrganizationUser
User = get_user_model()

class ChatGroupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        try:
            user = request.user

            organization = getattr(user, 'organization', None)
            employee = getattr(user, 'employee', None)

            if not organization and employee:
                organization = employee.organization

            if not organization:
                return Response(
                    {"detail": "Unable to determine your organization."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            groups = ChatGroup.objects.filter(
                organization=organization
            ).select_related('project', 'organization').prefetch_related('manual_members')

            user_groups = []

            for group in groups:
                try:
                    if group.user_is_member(user):
                        unread_count = UnreadMessage.objects.filter(
                            user=user,
                            group=group
                        ).count()

                        group.unread_count = unread_count
                        user_groups.append(group)
                except Exception as e:
                    print(f"[Chat] Membership check failed for group {group.id}: {e}")
                    continue

            serializer = ChatGroupSerializer(
                user_groups,
                many=True,
                context={'request': request}
            )

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"[Chat] Error in list(): {e}")
            return Response(
                {"error": "Failed to load chat groups"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def retrieve(self, request, pk=None):
        group = get_object_or_404(ChatGroup, pk=pk)
        
        # Check if user is member
        if not group.user_is_member(request.user):
            return Response(
                {"detail": "You are not a member of this group."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChatGroupSerializer(group, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_project_chat(self, request):
        """
        Endpoint to manually create a project chat (if auto-creation fails).
        """
        user = request.user
        project_id = request.data.get('project_id')
        
        if not project_id:
            return Response(
                {"error": "project_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id, organization=user.organization)
            
            # Check if chat group already exists
            existing_group = ChatGroup.objects.filter(
                project=project,
                group_type=ChatGroup.GROUP_TYPE_PROJECT
            ).first()
            
            if existing_group:
                return Response(
                    {"detail": "Chat group already exists for this project"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new chat group
            chat_group = ChatGroup.objects.create(
                name=f"Project: {project.name}",
                group_type=ChatGroup.GROUP_TYPE_PROJECT,
                organization=project.organization,
                project=project
            )
            
            serializer = ChatGroupSerializer(chat_group, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_messages(request, group_id):
    try:
        group = get_object_or_404(ChatGroup, pk=group_id)
        user = request.user

        # Use the reliable method from model
        if not group.user_is_member(user):
            return Response(
                {"detail": "You do not have access to this group."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get messages
        messages_qs = Message.objects.filter(group=group)\
            .select_related('sender')\
            .order_by('timestamp')

        # Filter private messages
        visible_messages = [msg for msg in messages_qs if msg.can_view(user)]

        serializer = MessageSerializer(
            visible_messages,
            many=True,
            context={'request': request}
        )

        # Mark as read
        UnreadMessage.objects.filter(user=user, group=group).delete()

        return Response(serializer.data)

    except Exception as e:
        print(f"[Chat Messages API] Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to load messages"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_chat_file(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    request.build_absolute_uri(file.url)  # Triggers save to media

    return Response({
        "url": request.build_absolute_uri(file.url),
        "filename": file.name
    })

import logging
logger = logging.getLogger(__name__)
User = get_user_model()

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_custom_chat_group(request):

    user = request.user

    # get role from OrganizationUser table
    org_user = OrganizationUser.objects.filter(user=user).first()
    role = org_user.role if org_user else None

    ALLOWED_ROLES = {
        "Admin",
        "HR Manager",
        "Manager",
        "Team Lead",
        "MD"
    }

    if role not in ALLOWED_ROLES:
        return Response(
            {"error": "You do not have permission to create chat groups"},
            status=403
        )

    name = request.data.get("name")
    member_ids = request.data.get("members", [])

    if not name:
        return Response({"error": "Group name required"}, status=400)

    if not member_ids:
        return Response({"error": "Select at least one member"}, status=400)

    member_ids = [int(i) for i in member_ids]

    organization = user.organization

    members = User.objects.filter(
        employee__id__in=member_ids,
        employee__organization=organization
    )

    members = members | User.objects.filter(id=user.id)

    if not members.exists():
        return Response({"error": "No valid members found"}, status=400)

    group = ChatGroup.objects.create(
        name=name.strip(),
        group_type=ChatGroup.GROUP_TYPE_CUSTOM,
        organization=organization,
        created_by=user
    )

    group.manual_members.set(members)

    serializer = ChatGroupSerializer(group)

    return Response(serializer.data, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_chat_members(request, project_id):
    """
    Get members of a project chat group.
    """
    try:
        # Get project
        project = get_object_or_404(Project, id=project_id)
        
        # Security: User must be in the project
        if not hasattr(request.user, 'employee'):
            return Response(
                {"detail": "You do not have an employee profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not project.members.filter(id=request.user.employee.id).exists():
            return Response(
                {"detail": "You are not a member of this project."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the chat group for this project
        chat_group = ChatGroup.objects.filter(
            project=project,
            group_type='project'
        ).first()
        
        if not chat_group:
            return Response(
                {"detail": "No chat group found for this project."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get members using your fixed get_members() method
        try:
            users = chat_group.get_members()
        except Exception as e:
            print(f"[Chat] get_members() failed: {e}")
            users = request.user.__class__.objects.none()  # empty queryset
        
        member_list = []
        for user in users:
            employee = getattr(user, 'employee', None)
            member_list.append({
                'id': user.id,
                'email': user.email,
                'full_name': employee.full_name if employee else user.email,
                'employee_id': employee.id if employee else None,
                'department': employee.department.name if employee and employee.department else None,
                'position': employee.designation.title if employee and employee.designation else None,
                'photo': employee.photo.url if employee and employee.photo else None,
                'role': getattr(employee, 'role', None),
            })
        
        return Response({
            'project_id': project.id,
            'project_name': project.name,
            'chat_group_id': chat_group.id,
            'total_members': len(member_list),
            'members': member_list
        })
        
    except Exception as e:
        print(f"[Chat] Critical error in get_project_chat_members: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pinned_messages(request, group_id):
    group = get_object_or_404(ChatGroup, id=group_id)
    
    if not group.user_is_member(request.user):
        return Response({"detail": "Access denied"}, status=403)
    
    # For now, return empty list (or implement actual pinning later)
    pinned = []  # Replace with actual logic when you add pinning
    
    return Response(pinned)        

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_chat_group(request, group_id):
    user = request.user

    try:
        group = ChatGroup.objects.get(id=group_id)

        # Only creator can edit - NO admin override for modifications
        if group.created_by != user:
            return Response(
                {"error": "Only group creator can edit this group"},
                status=403
            )

        name = request.data.get("name")
        member_ids = request.data.get("members", [])

        if name:
            group.name = name.strip()
            group.save()

        if member_ids is not None:
            member_ids = [int(i) for i in member_ids]
            members = User.objects.filter(
                employee__id__in=member_ids,
                employee__organization=group.organization
            )
            # Always include creator
            members = members | User.objects.filter(id=user.id)
            group.manual_members.set(members)

        serializer = ChatGroupSerializer(group)
        return Response(serializer.data)

    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_member_to_group(request, group_id):
    user = request.user
    employee_id = request.data.get("employee_id")

    try:
        group = ChatGroup.objects.get(id=group_id)

        # Only creator can add members - NO admin override
        if group.created_by != user:
            return Response(
                {"error": "Only group creator can add members"},
                status=403
            )

        new_user = User.objects.filter(
            employee__id=employee_id,
            employee__organization=group.organization
        ).first()

        if not new_user:
            return Response({"error": "Invalid member"}, status=400)

        group.manual_members.add(new_user)
        return Response({"message": "Member added successfully"})

    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_member_from_group(request, group_id):
    user = request.user
    employee_id = request.data.get("employee_id")

    try:
        group = ChatGroup.objects.get(id=group_id)

        # Only creator can remove members - NO admin override
        if group.created_by != user:
            return Response(
                {"error": "Only group creator can remove members"},
                status=403
            )

        remove_user = User.objects.filter(employee__id=employee_id).first()

        if remove_user == group.created_by:
            return Response(
                {"error": "Creator cannot be removed"},
                status=400
            )

        group.manual_members.remove(remove_user)
        return Response({"message": "Member removed successfully"})

    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_chat_group(request, group_id):
    user = request.user

    try:
        group = ChatGroup.objects.get(id=group_id)

        # Only creator can delete - NO admin override
        if group.created_by != user:
            return Response(
                {"error": "Only group creator can delete this group"},
                status=403
            )

        group.delete()
        return Response({"message": "Group deleted successfully"})

    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chat_group_members(request, group_id):
    """
    Get all members of a chat group with admin override
    """
    try:
        group = ChatGroup.objects.get(id=group_id)
        
        print("="*50)
        print(f"[DEBUG] Getting members for group ID: {group_id}")
        print(f"[DEBUG] User: {request.user.email}")
        print(f"[DEBUG] User role: {request.user.role}")
        print(f"[DEBUG] Group name: {group.name}")
        print(f"[DEBUG] Group type: {group.group_type}")
        
        # Check if user is admin
        is_admin_user = request.user.role in ['super_admin', 'sub_org_admin']
        print(f"[DEBUG] Is admin user: {is_admin_user}")
        
        # Get user's organization
        user_org = None
        if hasattr(request.user, 'employee') and request.user.employee:
            user_org = request.user.employee.organization
            print(f"[DEBUG] User organization: {user_org.name if user_org else 'None'}")
            print(f"[DEBUG] User organization ID: {user_org.id if user_org else 'None'}")
        else:
            print("[DEBUG] User has no employee profile")
        
        # Get group's organization through creator
        creator_org = None
        if group.created_by:
            print(f"[DEBUG] Group created by: {group.created_by.email}")
            if hasattr(group.created_by, 'employee') and group.created_by.employee:
                creator_org = group.created_by.employee.organization
                print(f"[DEBUG] Creator organization: {creator_org.name if creator_org else 'None'}")
                print(f"[DEBUG] Creator organization ID: {creator_org.id if creator_org else 'None'}")
            else:
                print("[DEBUG] Creator has no employee profile")
        else:
            print("[DEBUG] Group has no creator")
        
        # Check if user is in manual_members
        is_member = group.manual_members.filter(id=request.user.id).exists()
        print(f"[DEBUG] Is direct member: {is_member}")
        
        # Admin override logic
        if is_admin_user:
            if user_org and creator_org and user_org.id == creator_org.id:
                print(f"[DEBUG] ✅ ADMIN OVERRIDE: Organizations match! Granting access")
                # Grant access - continue to return members
            else:
                print(f"[DEBUG] ❌ ADMIN OVERRIDE FAILED: Organizations don't match")
                print(f"[DEBUG] User org ID: {user_org.id if user_org else 'None'}")
                print(f"[DEBUG] Creator org ID: {creator_org.id if creator_org else 'None'}")
                
                if not is_member:
                    print(f"[DEBUG] ❌ Access denied - not a member and admin override failed")
                    return Response(
                        {"error": "You are not a member of this group"},
                        status=403
                    )
        else:
            # Regular user - must be member
            if not is_member:
                print(f"[DEBUG] ❌ Access denied - regular user not a member")
                return Response(
                    {"error": "You are not a member of this group"},
                    status=403
                )
        
        # If we get here, access is granted
        print(f"[DEBUG] ✅ Access granted to user {request.user.email}")
        
        # Get members based on group type
        if group.group_type == 'project' and group.project:
            project_members = group.project.members.all()
            users = User.objects.filter(employee__in=project_members)
        else:
            users = group.manual_members.all()
        
        member_list = []
        for user in users:
            employee = getattr(user, 'employee', None)
            
            member_list.append({
                'id': user.id,
                'email': user.email,
                'full_name': employee.full_name if employee else (user.get_full_name() or user.email),
                'employee_id': employee.id if employee else None,
                'department': employee.department.name if employee and employee.department else None,
                'designation': employee.designation.title if employee and employee.designation else None,
                'photo': employee.photo.url if employee and employee.photo else None,
                'role': getattr(employee, 'role', None),
                'is_creator': group.created_by.id == user.id,
                'is_admin': group.created_by.id == user.id,
            })
        
        print(f"[DEBUG] Returning {len(member_list)} members")
        return Response(member_list)
        
    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)
    except Exception as e:
        print(f"[DEBUG] Error: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Internal server error"}, status=500)

        