# hr/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models as django_models
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from apps.hr.models import Task, TaskUpdate, DailyChecklist, Employee,Project
from apps.hr.serializers import TaskSerializer, TaskProgressUpdateSerializer, DailyChecklistSerializer,ProjectSerializer
from django.db.models import Avg, Count, Q
from datetime import datetime, timedelta
from rest_framework.decorators import api_view

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Task.objects.none()

        # Safe access to employee
        employee = getattr(user, 'employee', None)

        # Determine organization (from user or employee)
        organization = user.organization or (employee.organization if employee else None)

        # Case 1: High-level admins — see ALL tasks in organization
        if user.role in ['sub_org_admin', 'main_org_admin', 'super_admin']:
            if organization:
                return Task.objects.filter(organization=organization).order_by('-created_at')
            return Task.objects.none()

        # Case 2: Users with Employee profile (HR managers, TLs, regular employees)
        if employee:
            # HR Managers see all in org
            if employee.role in ['hr_manager', 'admin']:
                if organization:
                    return Task.objects.filter(organization=organization).order_by('-created_at')
                return Task.objects.none()

            # Regular employees and TLs: only tasks assigned to/from them
            return Task.objects.filter(
                django_models.Q(assigned_to=employee) |
                django_models.Q(assigned_by=employee)
            ).filter(organization=organization).order_by('-created_at')

        # Case 3: Authenticated but no access (shouldn't happen)
        return Task.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        employee = getattr(user, 'employee', None)

        # Determine organization
        organization = user.organization or (employee.organization if employee else None)
        if not organization:
            raise PermissionDenied("Cannot assign task: no organization found.")

        assigned_by = employee  # Can be None for pure admins

        serializer.save(
            assigned_by=assigned_by,
            organization=organization
        )
    @action(detail=True, methods=['patch'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        task = self.get_object()
        serializer = TaskProgressUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_progress = task.progress_percentage
        new_progress = serializer.validated_data.get('progress_percentage', old_progress)
        change_desc = serializer.validated_data['change_description']
        is_completed = serializer.validated_data.get('is_completed', task.is_completed)

        # Who updated the task?
        updated_by = getattr(request.user, 'employee', None)

        # Create history entry (git-like log)
        TaskUpdate.objects.create(
            task=task,
            updated_by=updated_by,
            change_description=change_desc,
            old_progress=old_progress,
            new_progress=new_progress
        )

        # Update the task
        task.progress_percentage = new_progress
        task.is_completed = is_completed
        task.save(update_fields=['progress_percentage', 'is_completed'])

        return Response(TaskSerializer(task, context={'request': request}).data)


class DailyChecklistViewSet(viewsets.ModelViewSet):
    queryset = DailyChecklist.objects.all()
    serializer_class = DailyChecklistSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return DailyChecklist.objects.none()

        # SAFE: Get employee if exists, else None
        employee = getattr(user, 'employee', None)

        # Case 1: High-level admins (sub_org_admin, main_org_admin, super_admin)
        # They can see ALL checklists in their organization
        if user.role in ['sub_org_admin', 'main_org_admin', 'super_admin']:
            if user.organization:
                return DailyChecklist.objects.filter(organization=user.organization).order_by('-date')
            else:
                return DailyChecklist.objects.none()

        # Case 2: Users with an actual Employee profile
        if employee:
            # HR Managers see all in org
            if employee.role in ['hr_manager', 'admin']:
                return DailyChecklist.objects.filter(organization=employee.organization).order_by('-date')

            # Regular employees/TLs only see their own
            return DailyChecklist.objects.filter(for_employee=employee).order_by('-date')

        # Case 3: Authenticated but no employee profile and not admin → no access
        return DailyChecklist.objects.none()

    # In apps/hr/views/task_views.py (or wherever your DailyChecklistViewSet is)

    @action(detail=True, methods=['patch'], url_path='rate')
    def rate(self, request, pk=None):
        checklist = self.get_object()

        rating = request.data.get('rating')
        if not rating or not (1 <= int(rating) <= 5):
            return Response(
                {"error": "Rating must be an integer between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # FIX: Use request.user instead of undefined 'user'
        user = request.user
        employee = getattr(user, 'employee', None)

        # Restrict who can rate — only admins and HR managers
        allowed_roles = ['sub_org_admin', 'main_org_admin', 'super_admin', 'hr_manager']
        if user.role not in allowed_roles and (employee and employee.role not in allowed_roles):
            return Response(
                {"error": "You do not have permission to rate daily checklists"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Save the rating
        checklist.rating = int(rating)
        checklist.rated_by = employee  # or None if pure admin
        checklist.comments = request.data.get('comments', checklist.comments or '')
        checklist.save()

        return Response(DailyChecklistSerializer(checklist).data)

@api_view(['GET'])
def performance_report(request):
    user = request.user
    employee = getattr(user, 'employee', None)

    # Determine organization
    organization = user.organization or (employee.organization if employee else None)
    if not organization:
        return Response({"error": "No organization found"}, status=400)

    # Weekly (last 7 days)
    week_start = datetime.today() - timedelta(days=7)
    weekly_checklists = DailyChecklist.objects.filter(
        organization=organization,
        date__gte=week_start
    ).exclude(rating__isnull=True)

    weekly_avg = weekly_checklists.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    weekly_count = weekly_checklists.count()

    # Monthly (last 30 days)
    month_start = datetime.today() - timedelta(days=30)
    monthly_checklists = DailyChecklist.objects.filter(
        organization=organization,
        date__gte=month_start
    ).exclude(rating__isnull=True)

    monthly_avg = monthly_checklists.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    monthly_count = monthly_checklists.count()

    # Task completion stats
    tasks = Task.objects.filter(organization=organization)
    completed_tasks = tasks.filter(is_completed=True).count()
    total_tasks = tasks.count()
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    return Response({
        "weekly": {
            "average_rating": round(weekly_avg, 2),
            "rated_days": weekly_count,
            "period": "Last 7 days"
        },
        "monthly": {
            "average_rating": round(monthly_avg, 2),
            "rated_days": monthly_count,
            "period": "Last 30 days"
        },
        "tasks": {
            "completed": completed_tasks,
            "total": total_tasks,
            "completion_rate": round(task_completion_rate, 2)
        }
    })

@api_view(['GET'])
def project_updates(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    # Security: only users in same organization
    if request.user.organization != project.organization:
        raise PermissionDenied()

    tasks = project.tasks.all().order_by('-updated_at')
    task_data = TaskSerializer(tasks, many=True).data

    # Get all updates for tasks in this project
    updates = TaskUpdate.objects.filter(task__project=project).order_by('-timestamp')
    update_data = []
    for update in updates:
        update_data.append({
            "employee": update.updated_by.full_name if update.updated_by else "Unknown",
            "timestamp": update.timestamp,
            "description": update.change_description,
            "progress_change": f"{update.old_progress}% → {update.new_progress}%"
        })

    return Response({
        "project": project.name,
        "description": project.description,
        "tasks": task_data,
        "updates": update_data,
        "total_updates": len(update_data)
    })        

class ProjectViewSet(viewsets.ModelViewSet):  # ← CHANGE FROM ReadOnlyModelViewSet
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee = getattr(user, 'employee', None)
        organization = user.organization or (employee.organization if employee else None)
        
        if not organization:
            return Project.objects.none()
        
        return Project.objects.filter(organization=organization).order_by('-start_date')

    def perform_create(self, serializer):
        user = self.request.user
        employee = getattr(user, 'employee', None)
        organization = user.organization or (employee.organization if employee else None)
        
        if not organization:
            raise PermissionDenied("No organization found")
        
        serializer.save(
            organization=organization,
            created_by=employee
        )