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
from django.db import models
from django.db.models import Count, Q
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

            # Get groups in one optimized query
            groups = ChatGroup.objects.filter(
                organization=organization
            ).select_related(
                'project', 'organization', 'created_by'
            ).prefetch_related(
                'manual_members'
            ).annotate(
                unread_count=Count(
                    'unreadmessage',
                    filter=Q(unreadmessage__user=user)
                )
            )

            # Filter groups where user is member
            user_groups = [
                group for group in groups
                if group.user_is_member(user)
            ]

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
    try:
        user = request.user

        # Check permissions
        org_user = OrganizationUser.objects.filter(user=user).first()
        role = org_user.role if org_user else user.role

        ALLOWED_ROLES = {
            "Admin",
            "HR Manager",
            "Manager",
            "Team Lead",
            "MD",
            "sub_org_admin",
            "main_org_admin"
        }

        if role not in ALLOWED_ROLES:
            return Response(
                {"error": "You do not have permission to create chat groups"},
                status=403
            )

        # Get request data
        name = request.data.get("name")
        member_ids = request.data.get("members", [])

        if not name:
            return Response({"error": "Group name required"}, status=400)

        if not member_ids:
            return Response({"error": "Select at least one member"}, status=400)

        # Convert member_ids to integers
        try:
            member_ids = [int(id) for id in member_ids if id]
        except (ValueError, TypeError):
            return Response({"error": "Invalid member IDs"}, status=400)

        # Get user's organization
        organization = None
        
        # Check direct organization field
        if hasattr(user, 'organization') and user.organization:
            organization = user.organization
        
        # Check through employee
        elif hasattr(user, 'employee') and user.employee and user.employee.organization:
            organization = user.employee.organization
        
        # Check through OrganizationUser
        else:
            org_user = OrganizationUser.objects.filter(user=user).first()
            if org_user and org_user.organization:
                organization = org_user.organization

        if not organization:
            return Response(
                {"error": "Unable to determine your organization"},
                status=400
            )

        # Get all organizations in the hierarchy (main + all subs)
        all_organizations = [organization]
        
        # If this is a main organization, include all sub-organizations
        if organization.organization_type == 'main':
            sub_orgs = Organization.objects.filter(
                parent_organization=organization,
                is_active=True
            )
            all_organizations.extend(sub_orgs)
        
        # If this is a sub-organization, include the main org
        elif organization.parent_organization:
            all_organizations.append(organization.parent_organization)

        # Find members using multiple strategies
        members = User.objects.filter(
            id__in=member_ids,
            is_active=True
        ).filter(
            # User belongs to any organization in our scope
            models.Q(organization__in=all_organizations) |  # Direct organization field
            models.Q(employee__organization__in=all_organizations)  # Through employee
        ).distinct()

        # Always include the creator
        if not members.filter(id=user.id).exists():
            creator = User.objects.filter(id=user.id, is_active=True)
            if creator.exists():
                members = members | creator

        # Verify we have members
        if not members.exists():
            return Response(
                {"error": "No valid members found. Please ensure all selected users are active."},
                status=400
            )

        # Create the chat group
        group = ChatGroup.objects.create(
            name=name.strip(),
            group_type=ChatGroup.GROUP_TYPE_CUSTOM,
            organization=organization,  # Use the original organization
            created_by=user
        )

        # Add members
        group.manual_members.set(members)

        # Serialize and return
        serializer = ChatGroupSerializer(group, context={'request': request})
        
        return Response(serializer.data, status=201)

    except Exception as e:
        return Response(
            {"error": f"Failed to create group: {str(e)}"},
            status=500
        )

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
    user_id = request.data.get("user_id")  # Add this to handle organization users

    try:
        group = ChatGroup.objects.get(id=group_id)

        # Only creator can add members
        if group.created_by != user:
            return Response(
                {"error": "Only group creator can add members"},
                status=403
            )

        new_user = None

        # Handle employee_id (from hr/employees/)
        if employee_id:
            new_user = User.objects.filter(
                employee__id=employee_id,
                employee__organization=group.organization
            ).first()
            
            if not new_user:
                return Response(
                    {"error": "Employee not found or not in this organization"},
                    status=400
                )

        # Handle user_id (from organization users)
        elif user_id:
            # Check if user exists and is in the same organization
            new_user = User.objects.filter(id=user_id).first()
            
            if not new_user:
                return Response(
                    {"error": "User not found"},
                    status=400
                )
            
            # Verify user belongs to the same organization
            org_user = OrganizationUser.objects.filter(
                user=new_user,
                organization=group.organization,
                is_active=True
            ).first()
            
            if not org_user:
                return Response(
                    {"error": "User is not a member of this organization"},
                    status=400
                )
        else:
            return Response(
                {"error": "Either employee_id or user_id is required"},
                status=400
            )

        # Check if user is already a member
        if group.manual_members.filter(id=new_user.id).exists():
            return Response(
                {"error": "User is already a member of this group"},
                status=400
            )

        group.manual_members.add(new_user)
        
        return Response({
            "message": "Member added successfully",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "full_name": new_user.get_full_name()
            }
        })

    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)
    except Exception as e:
        print(f"Error adding member: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "An error occurred while adding member"},
            status=500
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_member_from_group(request, group_id):
    user = request.user
    employee_id = request.data.get("employee_id")
    user_id = request.data.get("user_id")

    try:
        group = ChatGroup.objects.get(id=group_id)

        # Only creator can remove members
        if group.created_by != user:
            return Response(
                {"error": "Only group creator can remove members"},
                status=403
            )

        remove_user = None

        if employee_id:
            remove_user = User.objects.filter(employee__id=employee_id).first()
        elif user_id:
            remove_user = User.objects.filter(id=user_id).first()
        else:
            return Response(
                {"error": "Either employee_id or user_id is required"},
                status=400
            )

        if not remove_user:
            return Response({"error": "User not found"}, status=404)

        if remove_user == group.created_by:
            return Response(
                {"error": "Creator cannot be removed"},
                status=400
            )

        # Check if user is in the group
        if not group.manual_members.filter(id=remove_user.id).exists():
            return Response(
                {"error": "User is not a member of this group"},
                status=400
            )

        group.manual_members.remove(remove_user)
        
        return Response({
            "message": "Member removed successfully",
            "user": {
                "id": remove_user.id,
                "email": remove_user.email,
                "full_name": remove_user.get_full_name()
            }
        })

    except ChatGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=404)
    except Exception as e:
        print(f"Error removing member: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "An error occurred while removing member"},
            status=500
        )

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
        is_admin_user = request.user.role in ['super_admin', 'sub_org_admin', 'main_org_admin']
        print(f"[DEBUG] Is admin user: {is_admin_user}")
        
        # Get user's organization
        user_org = None
        if hasattr(request.user, 'organization') and request.user.organization:
            user_org = request.user.organization
            print(f"[DEBUG] User organization (direct): {user_org.name}")
        elif hasattr(request.user, 'employee') and request.user.employee:
            user_org = request.user.employee.organization
            print(f"[DEBUG] User organization (employee): {user_org.name if user_org else 'None'}")
        else:
            # Try OrganizationUser
            org_user = OrganizationUser.objects.filter(user=request.user).first()
            if org_user:
                user_org = org_user.organization
                print(f"[DEBUG] User organization (OrganizationUser): {user_org.name}")
        
        # Get group's organization
        group_org = group.organization
        print(f"[DEBUG] Group organization: {group_org.name if group_org else 'None'}")
        
        # Check if user is in manual_members
        is_member = group.manual_members.filter(id=request.user.id).exists()
        print(f"[DEBUG] Is direct member: {is_member}")
        
        # Admin override logic - check if user is admin in the same organization hierarchy
        if is_admin_user:
            if user_org and group_org:
                # Check if user's org is the same as group org or if group org is a sub-org of user's org
                if user_org.id == group_org.id or (group_org.parent_organization and group_org.parent_organization.id == user_org.id):
                    print(f"[DEBUG] ✅ ADMIN OVERRIDE: Organizations match! Granting access")
                else:
                    print(f"[DEBUG] ❌ ADMIN OVERRIDE FAILED: Organizations don't match")
                    if not is_member:
                        return Response(
                            {"error": "You are not a member of this group"},
                            status=403
                        )
            else:
                if not is_member:
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
        
        # Prefetch related data for better performance
        users = users.select_related('employee__department', 'employee__designation').prefetch_related('organizationuser_set__organization')
        
        member_list = []
        for user in users:
            employee = getattr(user, 'employee', None)
            
            # Get user's role from multiple sources
            user_role = user.role
            org_role = None
            
            # Check OrganizationUser for role
            org_user = user.organizationuser_set.filter(organization=group_org).first()
            if org_user:
                org_role = org_user.role
            
            # Determine display role
            display_role = org_role or user_role
            
            # Get organization info
            user_organization = None
            if user.organization:
                user_organization = {
                    'id': user.organization.id,
                    'name': user.organization.name,
                    'type': user.organization.organization_type
                }
            elif employee and employee.organization:
                user_organization = {
                    'id': employee.organization.id,
                    'name': employee.organization.name,
                    'type': employee.organization.organization_type
                }
            
            member_list.append({
                'id': user.id,
                'email': user.email,
                'full_name': employee.full_name if employee else (user.get_full_name() or user.email),
                'employee_id': employee.id if employee else None,
                'department': employee.department.name if employee and employee.department else None,
                'designation': employee.designation.title if employee and employee.designation else None,
                'photo': employee.photo.url if employee and employee.photo else None,
                'role': display_role,
                'user_role': user_role,
                'org_role': org_role,
                'is_creator': group.created_by_id == user.id,
                'is_admin': group.created_by_id == user.id,
                'organization': user_organization,
                'user_type': 'sub_admin' if user_role == 'sub_org_admin' else
                            'main_admin' if user_role == 'main_org_admin' else
                            'super_admin' if user_role == 'super_admin' else
                            'org_user' if org_role else 'employee'
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
# apps/hr/views/chat_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, OrganizationUser
from apps.hr.models import Employee

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_organization_users(request):
    """
    Get all organization users (users with OrganizationUser entries)
    for the current user's organization
    """
    try:
        user = request.user
        
        # Get user's organization
        organization = None
        if hasattr(user, 'employee') and user.employee:
            organization = user.employee.organization
        else:
            # Try to get from OrganizationUser
            org_user = OrganizationUser.objects.filter(user=user).first()
            if org_user:
                organization = org_user.organization
        
        if not organization:
            return Response(
                {"error": "Unable to determine your organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[DEBUG] Fetching organization users for organization: {organization.name} (ID: {organization.id})")
        
        # Get all OrganizationUser entries for this organization
        org_users = OrganizationUser.objects.filter(
            organization=organization,
            is_active=True
        ).select_related('user', 'user__employee')
        
        users_data = []
        for org_user in org_users:
            user_obj = org_user.user
            employee = getattr(user_obj, 'employee', None)
            
            # Get department and designation from employee if available
            department_name = None
            designation_title = None
            photo_url = None
            
            if employee:
                if employee.department:
                    department_name = employee.department.name
                if employee.designation:
                    designation_title = employee.designation.title
                if employee.photo:
                    photo_url = employee.photo.url
            
            user_data = {
                'id': user_obj.id,
                'email': user_obj.email,
                'first_name': user_obj.first_name,
                'last_name': user_obj.last_name,
                'full_name': employee.full_name if employee else user_obj.get_full_name() or user_obj.email,
                'photo': photo_url,
                'department': {
                    'id': employee.department.id if employee and employee.department else None,
                    'name': department_name
                } if department_name else None,
                'designation': {
                    'id': employee.designation.id if employee and employee.designation else None,
                    'title': designation_title
                } if designation_title else None,
                'role': org_user.role,
                'organization': {
                    'id': organization.id,
                    'name': organization.name
                },
                'user_type': 'org_user',
                'is_active': user_obj.is_active
            }
            users_data.append(user_data)
        
        print(f"[DEBUG] Found {len(users_data)} organization users")
        return Response(users_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch organization users: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch organization users"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sub_organization_admins(request):
    """
    Get all sub-organization admins for the current user's organization
    Based on User model with role='sub_org_admin'
    """
    try:
        user = request.user
        
        # Get user's main organization (the parent org)
        main_organization = None
        
        # Check if user has direct organization field
        if hasattr(user, 'organization') and user.organization:
            main_organization = user.organization
            # If this is a sub-org admin, get their parent organization
            if main_organization.organization_type == 'sub' and main_organization.parent_organization:
                main_organization = main_organization.parent_organization
        elif hasattr(user, 'employee') and user.employee and user.employee.organization:
            main_organization = user.employee.organization
            # If this is a sub-org admin through employee, get parent
            if main_organization.organization_type == 'sub' and main_organization.parent_organization:
                main_organization = main_organization.parent_organization
        
        if not main_organization:
            return Response(
                {"error": "Unable to determine your organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[DEBUG] Fetching sub-organization admins for main organization: {main_organization.name} (ID: {main_organization.id})")
        
        # Get all sub-organizations under this main organization
        sub_organizations = Organization.objects.filter(
            parent_organization=main_organization,
            organization_type='sub',
            is_active=True
        )
        
        print(f"[DEBUG] Found {sub_organizations.count()} sub-organizations")
        
        if not sub_organizations.exists():
            return Response([], status=status.HTTP_200_OK)
        
        # Get all users with role='sub_org_admin' who belong to these sub-organizations
        # Using the direct organization field on User model
        sub_org_admins = User.objects.filter(
            organization__in=sub_organizations,
            role='sub_org_admin',
            is_active=True
        ).select_related('organization')
        
        print(f"[DEBUG] Found {sub_org_admins.count()} sub-organization admins")
        
        users_data = []
        for admin in sub_org_admins:
            # Try to get employee data if exists
            employee = None
            try:
                employee = Employee.objects.filter(user=admin).first()
            except:
                pass
            
            # Get department and designation from employee if available
            department_name = None
            designation_title = None
            photo_url = None
            full_name = admin.get_full_name() or admin.email
            
            if employee:
                if employee.department:
                    department_name = employee.department.name
                if employee.designation:
                    designation_title = employee.designation.title
                if employee.photo:
                    photo_url = employee.photo.url
                if employee.full_name:
                    full_name = employee.full_name
            
            user_data = {
                'id': admin.id,
                'email': admin.email,
                'first_name': admin.first_name,
                'last_name': admin.last_name,
                'full_name': full_name,
                'photo': photo_url,
                'department': {
                    'id': employee.department.id if employee and employee.department else None,
                    'name': department_name
                } if department_name else None,
                'designation': {
                    'id': employee.designation.id if employee and employee.designation else None,
                    'title': designation_title
                } if designation_title else None,
                'role': admin.role,
                'sub_organization': {
                    'id': admin.organization.id,
                    'name': admin.organization.name,
                    'code': admin.organization.code,
                    'subdomain': admin.organization.subdomain
                } if admin.organization else None,
                'user_type': 'sub_admin',
                'user_type_label': 'Sub-Organization Admin',
                'is_active': admin.is_active
            }
            users_data.append(user_data)
        
        print(f"[DEBUG] Returning {len(users_data)} sub-organization admins")
        return Response(users_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch sub-organization admins: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch sub-organization admins"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Optional: Combined endpoint that returns all three types at once
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_chat_users(request):
    """
    Get all users available for chat including:
    - Regular employees
    - Organization users
    - Sub-organization admins
    """
    try:
        user = request.user
        
        # Get user's organization
        organization = None
        if hasattr(user, 'employee') and user.employee:
            organization = user.employee.organization
        else:
            org_user = OrganizationUser.objects.filter(user=user).first()
            if org_user:
                organization = org_user.organization
        
        if not organization:
            return Response(
                {"error": "Unable to determine your organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[DEBUG] Fetching all chat users for organization: {organization.name}")
        
        # 1. Get regular employees
        employees = Employee.objects.filter(
            organization=organization,
            is_active=True
        ).select_related('user', 'department', 'designation')
        
        employee_users = []
        for emp in employees:
            if emp.user:
                employee_users.append({
                    'id': emp.user.id,
                    'email': emp.user.email,
                    'first_name': emp.user.first_name,
                    'last_name': emp.user.last_name,
                    'full_name': emp.full_name,
                    'photo': emp.photo.url if emp.photo else None,
                    'department': {
                        'id': emp.department.id if emp.department else None,
                        'name': emp.department.name if emp.department else None
                    },
                    'designation': {
                        'id': emp.designation.id if emp.designation else None,
                        'title': emp.designation.title if emp.designation else None
                    },
                    'user_type': 'employee',
                    'organization': {
                        'id': organization.id,
                        'name': organization.name
                    }
                })
        
        # 2. Get organization users (excluding those already in employees)
        org_user_entries = OrganizationUser.objects.filter(
            organization=organization,
            is_active=True
        ).exclude(
            user__employee__in=employees
        ).select_related('user', 'user__employee')
        
        org_users = []
        for org_user in org_user_entries:
            user_obj = org_user.user
            employee = getattr(user_obj, 'employee', None)
            
            org_users.append({
                'id': user_obj.id,
                'email': user_obj.email,
                'first_name': user_obj.first_name,
                'last_name': user_obj.last_name,
                'full_name': employee.full_name if employee else user_obj.get_full_name() or user_obj.email,
                'photo': employee.photo.url if employee and employee.photo else None,
                'department': {
                    'id': employee.department.id if employee and employee.department else None,
                    'name': employee.department.name if employee and employee.department else None
                } if employee and employee.department else None,
                'designation': {
                    'id': employee.designation.id if employee and employee.designation else None,
                    'title': employee.designation.title if employee and employee.designation else None
                } if employee and employee.designation else None,
                'role': org_user.role,
                'user_type': 'org_user',
                'organization': {
                    'id': organization.id,
                    'name': organization.name
                }
            })
        
        # 3. Get sub-organization admins
        sub_organizations = Organization.objects.filter(
            parent_organization=organization,
            organization_type='sub',
            is_active=True
        )
        
        sub_admin_entries = OrganizationUser.objects.filter(
            organization__in=sub_organizations,
            role__in=['Admin', 'Sub Organization Admin'],
            is_active=True
        ).select_related('user', 'user__employee', 'organization')
        
        sub_admins = []
        for admin in sub_admin_entries:
            user_obj = admin.user
            employee = getattr(user_obj, 'employee', None)
            
            sub_admins.append({
                'id': user_obj.id,
                'email': user_obj.email,
                'first_name': user_obj.first_name,
                'last_name': user_obj.last_name,
                'full_name': employee.full_name if employee else user_obj.get_full_name() or user_obj.email,
                'photo': employee.photo.url if employee and employee.photo else None,
                'department': {
                    'id': employee.department.id if employee and employee.department else None,
                    'name': employee.department.name if employee and employee.department else None
                } if employee and employee.department else None,
                'designation': {
                    'id': employee.designation.id if employee and employee.designation else None,
                    'title': employee.designation.title if employee and employee.designation else None
                } if employee and employee.designation else None,
                'role': admin.role,
                'sub_organization': {
                    'id': admin.organization.id,
                    'name': admin.organization.name,
                    'code': admin.organization.code
                },
                'user_type': 'sub_admin'
            })
        
        # Combine all users
        all_users = employee_users + org_users + sub_admins
        
        print(f"[DEBUG] Total users found: {len(all_users)} (Employees: {len(employee_users)}, Org Users: {len(org_users)}, Sub Admins: {len(sub_admins)})")
        
        return Response({
            'employees': employee_users,
            'organization_users': org_users,
            'sub_organization_admins': sub_admins,
            'all_users': all_users,
            'total_count': len(all_users)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch all chat users: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch users"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )              