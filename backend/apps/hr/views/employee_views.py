# apps/hr/views/employee_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
User = get_user_model()        
from django.db import transaction
from apps.hr.models import Department, Designation, Employee, EmployeeDocument, EmployeeInvite
from apps.hr.serializers import (
    DepartmentSerializer,
    DesignationSerializer,
    EmployeeSerializer,
    EmployeeDocumentSerializer,
    EmployeeCreateInvitationSerializer,
)
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
class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "role") and user.role in ["HR", "Admin"]:
            return Employee.objects.select_related(
                'department', 'designation', 'user'
            ).filter(
                organization=user.organization
            ).order_by("full_name")
        try:
            current_employee = Employee.objects.get(user=user)
            return Employee.objects.select_related(
                'department', 'designation', 'user'
            ).filter(
                organization=current_employee.organization
            ).order_by("full_name")
        except Employee.DoesNotExist:
            return Employee.objects.none()
    @action(detail=False, methods=['get'])
    def debug(self, request):
        return Response({
            "message": "EmployeeViewSet is working!",
            "user": request.user.username if request.user.is_authenticated else "Anonymous"
        })
    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            return Response(self.get_serializer(employee).data)
        except Employee.DoesNotExist:
            return Response({"detail": "No employee profile found"}, status=404)
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
class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeDocumentSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role in ["HR", "Admin"]:
            return EmployeeDocument.objects.filter(employee__organization=user.organization)
        return EmployeeDocument.objects.filter(employee__user=user)
    def perform_create(self, serializer):
        try:
            employee = Employee.objects.get(user=self.request.user)
            serializer.save(employee=employee)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Employee profile not found")
@api_view(['GET', 'POST'])
def accept_invite_view(request, token):
    try:
        invite = EmployeeInvite.objects.get(token=token, is_accepted=False)
    except EmployeeInvite.DoesNotExist:
        return Response(
            {'detail': 'Invalid or expired invitation.'},
            status=status.HTTP_404_NOT_FOUND
        )
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
            user = User.objects.create_user(
                email=invite.email,
                password=password,
                username=invite.email, 
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
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from apps.hr.models import LeaveRequest, PermissionRequest
from apps.hr.serializers import (
    LeaveRequestSerializer, LeaveRequestUpdateSerializer,
    PermissionRequestSerializer, PermissionRequestUpdateSerializer,
    SimpleUserSerializer
)
from apps.hr.permissions import IsOwnerOrManager
User = get_user_model()
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from apps.hr.models import Employee
from apps.hr.serializers import SimpleUserSerializer
User = get_user_model()
class ManagerListView(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SimpleUserSerializer
    def get_queryset(self):
        user = self.request.user
        try:
            current_employee = Employee.objects.get(user=user)
            org = current_employee.organization
        except Employee.DoesNotExist:
            return User.objects.none()
        manager_roles = ["hr", "admin"]  
        managers = Employee.objects.filter(
            organization=org,
            role__in=manager_roles,
            is_active=True
        ).exclude(user=current_employee.user)
        return User.objects.filter(employee__in=managers)
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.hr.models import (
    LeaveRequest,
    PermissionRequest,
    EmployeeReimbursement,
    Employee,
)
from apps.hr.serializers import (
    LeaveRequestSerializer,
    LeaveRequestUpdateSerializer,
    PermissionRequestSerializer,
    PermissionRequestUpdateSerializer,
    EmployeeReimbursementSerializer,
)
from apps.accounts.models import User  # Assuming User model is here


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().select_related('employee', 'manager', 'organization')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update', 'approve', 'reject']:
            return LeaveRequestUpdateSerializer
        return LeaveRequestSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]
        if user.is_superuser or user.is_staff:
            return LeaveRequest.objects.select_related('employee', 'manager', 'organization').all()
        try:
            employee = user.employee  # Assuming OneToOne or similar relation
            organization = employee.organization
        except AttributeError:
            return LeaveRequest.objects.none()
        queryset = LeaveRequest.objects.select_related('employee', 'manager').filter(
            organization=organization
        )
        if user.role in admin_roles:
            return queryset
        return queryset.filter(employee=user)
    def perform_create(self, serializer):
        try:
            organization = self.request.user.employee.organization
        except AttributeError:
            organization = None
        serializer.save(employee=self.request.user, organization=organization)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.status = 'approved'
        obj.response_note = request.data.get('response_note', '')
        obj.responded_at = timezone.now()
        obj.manager = request.user  # Optional: track who approved
        obj.save()
        return Response(LeaveRequestSerializer(obj, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        obj = self.get_object()
        obj.status = 'rejected'
        obj.response_note = request.data.get('response_note', '')
        obj.responded_at = timezone.now()
        obj.manager = request.user
        obj.save()
        return Response(LeaveRequestSerializer(obj, context={'request': request}).data)


class PermissionRequestViewSet(viewsets.ModelViewSet):
    queryset = PermissionRequest.objects.all().select_related('employee', 'manager', 'organization')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update', 'approve', 'reject']:
            return PermissionRequestUpdateSerializer
        return PermissionRequestSerializer

    def get_queryset(self):
        user = self.request.user
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]

        if user.is_superuser or user.is_staff:
            return PermissionRequest.objects.select_related('employee', 'manager', 'organization').all()

        try:
            employee = user.employee
            organization = employee.organization
        except AttributeError:
            return PermissionRequest.objects.none()

        queryset = PermissionRequest.objects.select_related('employee', 'manager').filter(
            organization=organization
        )

        if user.role in admin_roles:
            return queryset

        return queryset.filter(employee=user)

    def perform_create(self, serializer):
        try:
            organization = self.request.user.employee.organization
        except AttributeError:
            organization = None
        serializer.save(employee=self.request.user, organization=organization)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.status = 'approved'
        obj.response_note = request.data.get('response_note', '')
        obj.responded_at = timezone.now()
        obj.manager = request.user  # Optional: track who approved
        obj.save()
        return Response(PermissionRequestSerializer(obj, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        obj = self.get_object()
        obj.status = 'rejected'
        obj.response_note = request.data.get('response_note', '')
        obj.responded_at = timezone.now()
        obj.manager = request.user
        obj.save()
        return Response(PermissionRequestSerializer(obj, context={'request': request}).data)


class ManagerLeaveList(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.is_staff:
            leaves = LeaveRequest.objects.filter(status="pending").select_related("employee", "organization")
        else:
            try:
                organization = user.employee.organization
            except AttributeError:
                return Response([])

            leaves = LeaveRequest.objects.filter(
                manager=user,
                status="pending",
                organization=organization
            ).select_related("employee")

        return Response(LeaveRequestSerializer(leaves, many=True, context={'request': request}).data)


class ManagerPermissionList(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser or user.is_staff:
            permissions = PermissionRequest.objects.filter(status="pending").select_related("employee", "organization")
        else:
            try:
                organization = user.employee.organization
            except AttributeError:
                return Response([])

            permissions = PermissionRequest.objects.filter(
                manager=user,
                status="pending",
                organization=organization
            ).select_related("employee")

        return Response(PermissionRequestSerializer(permissions, many=True, context={'request': request}).data)


class EmployeeReimbursementViewSet(viewsets.ModelViewSet):
    queryset = EmployeeReimbursement.objects.all().select_related('employee', 'manager', 'organization')
    serializer_class = EmployeeReimbursementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]

        if user.is_superuser or user.is_staff:
            return EmployeeReimbursement.objects.select_related('employee', 'manager', 'organization').all()

        try:
            organization = user.employee.organization
        except AttributeError:
            return EmployeeReimbursement.objects.none()

        queryset = EmployeeReimbursement.objects.select_related('employee', 'manager').filter(
            organization=organization
        )

        if user.role in admin_roles:
            return queryset

        return queryset.filter(employee=user)

    def perform_create(self, serializer):
        try:
            organization = self.request.user.employee.organization
        except AttributeError:
            organization = None
        serializer.save(employee=self.request.user, organization=organization)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        reimbursement = self.get_object()
        # Optional: add check if user is manager or admin
        reimbursement.status = "approved"
        reimbursement.save()
        return Response({"message": "Reimbursement approved"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        reimbursement = self.get_object()
        reimbursement.status = "rejected"
        reimbursement.save()
        return Response({"message": "Reimbursement rejected"}, status=status.HTTP_200_OK)
    
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import time
from apps.hr.models import Employee
from apps.hr.models import Attendance, LatePunchRequest

PUNCH_START = time(9, 0)
PUNCH_END = time(9, 15)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def today_attendance(request):
    try:
        employee = request.user.employee
    except Employee.DoesNotExist:
        return Response(None)

    today = timezone.localdate()

    attendance = Attendance.objects.filter(
        employee=employee,
        date=today
    ).first()

    if not attendance:
        return Response(None)

    return Response({
        "id": attendance.id,
        "punch_in": attendance.punch_in,
        "punch_out": attendance.punch_out,
        "status": attendance.status,
        "is_late": attendance.is_late,
    })
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def punch_in(request):
        user = request.user
        try:
            employee = user.employee
        except Employee.DoesNotExist:
            return Response(
                {"message": "Employee not found"},
                status=400
            )
        organization = employee.organization
        today = timezone.localdate()
        now = timezone.localtime().time()
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            organization=organization,
            date=today
        )
        if attendance.punch_in:
            return Response(
                {"message": "Already punched in today"},
                status=400
            )
        attendance.punch_in = timezone.localtime()
        if PUNCH_START <= now <= PUNCH_END:
            attendance.status = "PRESENT"
        else:
            attendance.status = "PENDING"
            attendance.is_late = True
            LatePunchRequest.objects.create(
                attendance=attendance,
                reason=request.data.get("reason", "")
            )
        attendance.save()
        employee.is_logged_in = True
        employee.save(update_fields=["is_logged_in"])
        return Response({
            "message": "Punch in successful",
            "attendance_status": attendance.status
        })
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def punch_out(request):
    user = request.user
    try:
        employee = user.employee
    except Employee.DoesNotExist:
        return Response(
            {"message": "Employee not found"},
            status=400
        )
    organization = employee.organization
    today = timezone.localdate()
    attendance = Attendance.objects.filter(
        employee=employee,
        organization=organization,
        date=today
    ).first()
    if not attendance:
        return Response(
            {"message": "No attendance found for today"},
            status=400
        )
    if not attendance.punch_in:
        return Response(
            {"message": "Punch in first"},
            status=400
        )
    if attendance.punch_out:
        return Response(
            {"message": "Already punched out"},
            status=400
        )
    attendance.punch_out = timezone.localtime()
    attendance.save(update_fields=["punch_out"])
    employee.is_logged_in = False
    employee.save(update_fields=["is_logged_in"])
    return Response({
    "message": "Punch out successful",
    "attendance": {
        "id": attendance.id,
        "date": attendance.date,
        "punch_in": attendance.punch_in,
        "punch_out": attendance.punch_out,
        "status": attendance.status,
    }
})

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.hr.models import Attendance, Employee
from apps.hr.serializers import AttendanceSerializer

class AttendanceListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        
        try:
            # Get the employee's organization (any authenticated user must have an Employee profile)
            employee = user.employee
            organization = employee.organization
        except (AttributeError, Employee.DoesNotExist):
            return Response(
                {"detail": "Employee profile not found."},
                status=404
            )

        # NOW: Everyone (HR, Admin, or regular employee) sees ALL attendance in the organization
        queryset = Attendance.objects.filter(
            organization=organization
        ).select_related('employee').order_by('-date', '-punch_in')

        serializer = AttendanceSerializer(queryset, many=True)
        return Response(serializer.data)

# apps/hr/views/employee_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.hr.models import LatePunchRequest
from apps.hr.serializers import LatePunchRequestSerializer
from django.utils import timezone

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def late_punch_requests(request):
    try:
        employee = request.user.employee
        org = employee.organization
    except (AttributeError, Employee.DoesNotExist):
        return Response({"detail": "Employee profile not found."}, status=404)

    # NOW: All authenticated users in the organization can see ALL pending late requests
    queryset = LatePunchRequest.objects.filter(
        attendance__organization=org,
        status="PENDING"
    ).select_related('attendance__employee')

    serializer = LatePunchRequestSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def handle_late_request(request, pk):
    try:
        lpr = LatePunchRequest.objects.get(pk=pk)
    except LatePunchRequest.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    # REMOVED: Role check - Now anyone authenticated can approve/reject
    # Everyone in the organization can take action

    action = request.data.get("action", "").strip().upper()
    if action not in ["APPROVE", "REJECT"]:
        return Response({"detail": "Invalid action. Use 'APPROVE' or 'REJECT'"}, status=400)

    if action == "APPROVE":
        lpr.status = "APPROVED"
        lpr.attendance.status = "PRESENT"
        lpr.attendance.is_late = False
        lpr.attendance.save(update_fields=["status", "is_late"])
    else:  # REJECT
        lpr.status = "REJECTED"
        lpr.attendance.status = "LEAVE"  # Change to "ABSENT" if that's your policy
        lpr.attendance.save(update_fields=["status"])

    # Record who took the action
    lpr.approved_by = request.user
    lpr.approved_at = timezone.now()
    lpr.save()

    return Response({
        "message": f"Late punch request {action.lower()}d successfully by {request.user.get_full_name() or request.user.username}",
        "status": lpr.status,
        "approved_by": request.user.username
    }, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def monthly_attendance_report(request):
    month = request.GET.get("month")  # format: YYYY-MM
    if not month:
        return Response({"detail": "Month required"}, status=400)

    try:
        employee = request.user.employee
        org = employee.organization
    except AttributeError:
        return Response([])

    year, month_num = map(int, month.split("-"))

    from django.db.models import Count, Q
    from apps.hr.models import Attendance

    report = Attendance.objects.filter(
        organization=org,
        date__year=year,
        date__month=month_num
    ).values("employee__full_name").annotate(
        present=Count("id", filter=Q(status="PRESENT")),
        late=Count("id", filter=Q(is_late=True)),
        leave=Count("id", filter=Q(status="LEAVE"))
    )

    data = []
    for r in report:
        data.append({
            "employee_name": r["employee__full_name"],
            "present": r["present"],
            "late": r["late"],
            "leave": r["leave"]
        })

    return Response(data)


