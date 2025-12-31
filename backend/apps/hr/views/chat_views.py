from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes,action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.hr.models import ChatGroup, Message, UnreadMessage,Project,Designation
from apps.hr.serializers import ChatGroupSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from ..utils import get_project_members
User = get_user_model()

class ChatGroupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # Get user's organization
        organization = None
        
        # Try different ways to get organization
        if hasattr(user, 'organization') and user.organization:
            organization = user.organization
        elif hasattr(user, 'employee') and user.employee:
            if user.employee.organization:
                organization = user.employee.organization
        
        if not organization:
            return Response(
                {"detail": "Unable to determine your organization."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get all groups in the organization
            groups = ChatGroup.objects.filter(
                organization=organization
            ).select_related('project', 'organization').prefetch_related('manual_members')
            
            # Filter groups where user is a member
            user_groups = []
            for group in groups:
                try:
                    if group.user_is_member(user):
                        # Add unread count to group data
                        unread_count = UnreadMessage.objects.filter(
                            user=user, 
                            group=group
                        ).count()
                        group.unread_count = unread_count
                        user_groups.append(group)
                except Exception as e:
                    print(f"[Chat] Error checking membership for group {group.id}: {e}")
                    continue
            
            serializer = ChatGroupSerializer(
                user_groups,
                many=True,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"[Chat] Error loading groups: {e}")
            return Response(
                {"error": "Failed to load chat groups."},
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_custom_chat_group(request):
    user = request.user
    employee = getattr(user, 'employee', None)

    # Allowed User roles (from your custom User model)
    allowed_user_roles = ['super_admin', 'main_org_admin', 'sub_org_admin']
    
    # Allowed Employee roles
    allowed_employee_roles = ['hr_manager', 'admin']  # Add more like 'accountant' if needed

    # Check permission
    is_allowed = (
        user.role in allowed_user_roles or
        (employee and employee.role in allowed_employee_roles)
    )

    if not is_allowed:
        return Response(
            {"error": "You do not have permission to create custom chat groups. "
                     "Only HR Managers, Admins, and Organization Admins can create groups."},
            status=status.HTTP_403_FORBIDDEN
        )

    name = request.data.get('name')
    member_ids = request.data.get('members', [])

    if not name:
        return Response({"error": "Group name is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(member_ids) < 2:
        return Response({"error": "At least 2 members are required (including yourself)"}, status=status.HTTP_400_BAD_REQUEST)

    # Validate all members are in the same organization
    members = User.objects.filter(id__in=member_ids, organization=user.organization)
    if members.count() != len(set(member_ids)):
        return Response(
            {"error": "All selected members must belong to your organization"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create the custom group
    group = ChatGroup.objects.create(
        name=name.strip(),
        group_type='custom',
        organization=user.organization,
        created_by=user
    )
    group.manual_members.set(members)

    # Serialize and return
    from apps.hr.serializers import ChatGroupSerializer
    serializer = ChatGroupSerializer(group, context={'request': request})
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)    

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