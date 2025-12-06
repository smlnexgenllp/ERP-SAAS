# apps/hr/views/employee_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from django.contrib.auth import get_user_model
User = get_user_model()        # 🔥 FIXED — use custom user model

from django.db import transaction

from apps.hr.models import Department, Designation, Employee, EmployeeDocument, EmployeeInvite
from apps.hr.serializers import (
    DepartmentSerializer,
    DesignationSerializer,
    EmployeeSerializer,
    EmployeeDocumentSerializer,
    EmployeeCreateInvitationSerializer,
)


# ──────────────────────────────
# Department & Designation
# ──────────────────────────────
class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            employee = Employee.objects.get(user=user)
            return Department.objects.filter(organization=employee.organization).order_by('name')
        except Employee.DoesNotExist:
            return Department.objects.none()



class DesignationViewSet(viewsets.ModelViewSet):
    serializer_class = DesignationSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            employee = Employee.objects.get(user=user)
            return Designation.objects.filter(organization=employee.organization).order_by('title')
        except Employee.DoesNotExist:
            return Designation.objects.none()



# ──────────────────────────────
# Employee ViewSet
# ──────────────────────────────
class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        user = self.request.user

    # If HR/Admin (not an Employee), get organization from user model
        if hasattr(user, "role") and user.role in ["HR", "Admin"]:
            return Employee.objects.select_related(
                'department', 'designation', 'user'
            ).filter(
                organization=user.organization
            ).order_by("full_name")

    # Else: normal employee
        try:
            current_employee = Employee.objects.get(user=user)
            return Employee.objects.select_related(
                'department', 'designation', 'user'
            ).filter(
                organization=current_employee.organization
            ).order_by("full_name")
        except Employee.DoesNotExist:
            return Employee.objects.none()


    # Debug endpoint
    @action(detail=False, methods=['get'])
    def debug(self, request):
        return Response({
            "message": "EmployeeViewSet is working!",
            "user": request.user.username if request.user.is_authenticated else "Anonymous"
        })

    # Current employee profile
    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            return Response(self.get_serializer(employee).data)
        except Employee.DoesNotExist:
            return Response({"detail": "No employee profile found"}, status=404)

    # Create Employee + Send Invite
    @action(detail=False, methods=['post'])
    def create_with_invite(self, request):
        serializer = EmployeeCreateInvitationSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            employee = serializer.save()
            return Response({
                "success": True,
                "message": f"Employee {employee.full_name} created and invitation sent!",
                "employee": EmployeeSerializer(employee).data
            }, status=201)

        return Response({"success": False, "errors": serializer.errors}, status=400)


# ──────────────────────────────
# Documents
# ──────────────────────────────
# Example in Django REST Framework
class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeDocumentSerializer

    def get_queryset(self):
        user = self.request.user
        # If HR/Admin, maybe allow all in org
        if user.role in ["HR", "Admin"]:
            return EmployeeDocument.objects.filter(employee__organization=user.organization)
        # Else only the employee’s own documents
        return EmployeeDocument.objects.filter(employee__user=user)


    def perform_create(self, serializer):
        try:
            employee = Employee.objects.get(user=self.request.user)
            serializer.save(employee=employee)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Employee profile not found")


# ──────────────────────────────
# ACCEPT INVITE — MAIN LOGIC FIXED
# ──────────────────────────────
@api_view(['GET', 'POST'])
def accept_invite_view(request, token):
    try:
        invite = EmployeeInvite.objects.get(token=token, is_accepted=False)
    except EmployeeInvite.DoesNotExist:
        return Response(
            {'detail': 'Invalid or expired invitation.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Return invite details for frontend
    if request.method == 'GET':
        return Response({
            'full_name': invite.full_name,
            'email': invite.email,
            'phone': invite.phone,
            'role': invite.role,
        })

    # Handle accept invite POST
    if request.method == 'POST':
        password = request.data.get('password')

        if not password:
            return Response(
                {'password': ['This field is required.']},
                status=400
            )

        with transaction.atomic():

            # 🔥 FIXED — create user from custom user model
            user = User.objects.create_user(
                email=invite.email,
                password=password,
                username=invite.email,  # optional depending on your model
                first_name=invite.full_name.split(' ')[0],
                last_name=' '.join(invite.full_name.split(' ')[1:]) if len(invite.full_name.split(' ')) > 1 else ''
            )

            # Create employee record
            employee = Employee.objects.create(
                user=user,
                full_name=invite.full_name,
                email=invite.email,
                phone=invite.phone,
                role=invite.role,
                department=invite.department,
                designation=invite.designation,
                date_of_joining=invite.date_of_joining,
                ctc=invite.ctc,
                notes=invite.notes,
                is_probation=invite.is_probation,
                organization=invite.organization
            )

            # Mark invite as accepted
            invite.is_accepted = True
            invite.save()

        return Response(
            {'detail': 'Employee account created successfully.'},
            status=201
        )
