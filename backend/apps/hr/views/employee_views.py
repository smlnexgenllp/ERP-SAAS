
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view,permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
User = get_user_model()        
from django.db import transaction
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.hr.models import Department, Designation, Employee, EmployeeDocument, EmployeeInvite, Salary, Invoice
from apps.hr.serializers import (DepartmentSerializer,DesignationSerializer,EmployeeSerializer,EmployeeDocumentSerializer,EmployeeCreateInvitationSerializer,SalarySerializer, InvoiceSerializer)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import time
from apps.hr.models import Employee
from apps.hr.models import Attendance, LatePunchRequest
from rest_framework import viewsets, permissions
from apps.hr.models import JobOpening, Referral
from apps.hr.serializers import JobOpeningSerializer, ReferralSerializer
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.hr.models import LatePunchRequest
from apps.hr.serializers import LatePunchRequestSerializer
from django.utils import timezone
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.hr.models import ( LeaveRequest,PermissionRequest,EmployeeReimbursement,Employee,)
from apps.hr.serializers import (
    LeaveRequestSerializer,
    LeaveRequestUpdateSerializer,
    PermissionRequestSerializer,
    PermissionRequestUpdateSerializer,
    EmployeeReimbursementSerializer,
)
from apps.accounts.models import User 
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
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
logger = logging.getLogger(__name__)

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'organization') and user.organization:
            return Department.objects.filter(
                organization=user.organization
            ).order_by('name')
        try:
            employee = Employee.objects.get(user=user)
            return Department.objects.filter(
                organization=employee.organization
            ).order_by('name')
        except Employee.DoesNotExist:
            return Department.objects.none()
class DesignationViewSet(viewsets.ModelViewSet):
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'organization') and user.organization:
            return Designation.objects.filter(
                organization=user.organization
            ).order_by('title')
        try:
            employee = Employee.objects.get(user=user)
            return Designation.objects.filter(
                organization=employee.organization
            ).order_by('title')
        except Employee.DoesNotExist:
            return Designation.objects.none()
class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "organization") or not user.organization:
            return Employee.objects.none()
        
        # If user has no organization, return empty
        if not hasattr(user, "organization") or not user.organization:
            return Employee.objects.none()

        # Return all employees in the user's organization
        return Employee.objects.select_related(
            'department', 'designation', 'user'
        ).filter(
            organization=user.organization
        ).order_by("full_name")

    @action(detail=False, methods=['get'])
    def debug(self, request):
        return Response({
            "message": "EmployeeViewSet is working!",
            "user": request.user.username if request.user.is_authenticated else "Anonymous",
            "organization": str(request.user.organization) if hasattr(request.user, 'organization') else "None"
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

User = get_user_model()
class ManagerListView(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SimpleUserSerializer

    def get_queryset(self):
        # Simply return all active users linked to an employee
        return User.objects.filter(employee__is_active=True).distinct()

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

    def get(self, request):
        user = request.user
        if not hasattr(user, 'organization') or not user.organization:
            return Response(
                {"detail": "No organization found for this user."},
                status=status.HTTP_403_FORBIDDEN
            )
        user_organization = user.organization
        queryset = LeaveRequest.objects.filter(
            organization=user_organization
        ).select_related('employee', 'manager')
        if user.role not in ['admin', 'hr', 'sub_org_admin']:
            queryset = queryset.filter(employee=user)  # Direct FK to User model
        queryset = queryset.order_by('-applied_at')
        serializer = LeaveRequestSerializer(
            queryset,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

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

    def get(self, request):
        user = request.user

        # Check organization
        if not hasattr(user, 'organization') or not user.organization:
            return Response({"detail": "No organization found."}, status=403)

        organization = user.organization

        # All permission requests in the organization
        queryset = PermissionRequest.objects.filter(
            organization=organization
        ).select_related('employee', 'manager')

        # Non-admin roles see only their own permission requests
        if user.role not in ['admin', 'hr', 'sub_org_admin']:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                return Response({"detail": "No employee profile found."}, status=404)

        queryset = queryset.order_by('-applied_at')

        serializer = PermissionRequestSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

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
from rest_framework.exceptions import ValidationError
class EmployeeReimbursementViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeReimbursementSerializer
    permission_classes = [IsAuthenticated]
    queryset = EmployeeReimbursement.objects.none()
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return EmployeeReimbursement.objects.select_related('employee', 'manager', 'organization').all()
        if not hasattr(user, 'organization') or not user.organization:
            return EmployeeReimbursement.objects.none()
        organization = user.organization
        return EmployeeReimbursement.objects.select_related('employee', 'manager', 'organization').filter(
            organization=organization
        ).order_by('-date')
    def perform_create(self, serializer):
        organization = None
        try:
            organization = self.request.user.employee.organization
        except AttributeError:
            pass
        serializer.save(employee=self.request.user, organization=organization)
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        reimbursement = self.get_object()
        reimbursement.status = "approved"
        reimbursement.manager = request.user
        reimbursement.save(update_fields=["status", "manager"])
        return Response({"message": "Reimbursement approved"}, status=200)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        reimbursement = self.get_object()
        reimbursement.status = "rejected"
        reimbursement.manager = request.user
        reimbursement.save(update_fields=["status", "manager"])
        return Response({"message": "Reimbursement rejected"}, status=200)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_organization_employees(request):
    try:
        user = request.user
        if not user.organization:
            return Response({
                'success': False,
                'error': 'User is not associated with any organization'
            }, status=status.HTTP_400_BAD_REQUEST)
        organization = user.organization
        employees = Employee.objects.filter(
            organization=organization,
            is_active=True
        ).only('id', 'full_name', 'employee_code', 'email', 'designation', 'department')
        data = []
        for emp in employees:
            designation_title = None
            if emp.designation:
                designation_title = emp.designation.title
            department_name = None
            if emp.department:
                department_name = emp.department.name
            emp_data = {
                'id': emp.id,
                'full_name': emp.full_name,
                'employee_code': emp.employee_code,
                'email': emp.email,
                'designation': designation_title,  # Just the title string
                'department': department_name,      # Just the name string
                'has_salary': hasattr(emp, 'salary_info'),
            }
            data.append(emp_data)
        return Response({
            'success': True,
            'data': data,
            'organization': {
                'id': organization.id,
                'name': organization.name,
                'type': organization.organization_type
            }
        })
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_list_create(request):
    try:
        user = request.user
        if not user.organization:
            return Response({
                'success': False,
                'error': 'User is not associated with any organization'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        organization = user.organization
        data = request.data.copy()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return Response({
                'success': False,
                'error': 'Employee ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify employee belongs to user's organization
        employee = get_object_or_404(
            Employee, 
            id=employee_id, 
            organization=organization,
            is_active=True
        )
        
        # Create or update salary
        salary, created = Salary.objects.get_or_create(employee=employee)
        
        # Update salary fields
        for field in [
            'basic_salary', 'hra', 'medical_allowance', 'conveyance_allowance',
            'special_allowance', 'other_allowances', 'professional_tax',
            'income_tax', 'other_deductions', 'has_esi', 'esi_number',
            'esi_employee_share_percentage', 'esi_employer_share_percentage',
            'has_pf', 'pf_number', 'uan_number', 'pf_employee_share_percentage',
            'pf_employer_share_percentage', 'pf_voluntary_percentage',
            'effective_date', 'notes'
        ]:
            if field in data:
                setattr(salary, field, data[field])
        
        # Calculate and save
        salary.save()
        
        serializer = SalarySerializer(salary)
        
        return Response({
            'success': True,
            'message': 'Salary saved successfully' if created else 'Salary updated successfully',
            'data': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error saving salary: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_employee_salary(request, employee_id):
    """
    Get salary for specific employee
    Only allow if employee belongs to user's organization
    """
    try:
        user = request.user
        
        # Check if user has organization
        if not user.organization:
            return Response({
                'success': False,
                'error': 'User is not associated with any organization'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        organization = user.organization
        
        # Get employee from user's organization
        employee = get_object_or_404(
            Employee, 
            id=employee_id, 
            organization=organization,
            is_active=True
        )
        
        try:
            salary = Salary.objects.get(employee=employee)
            serializer = SalarySerializer(salary)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Salary.DoesNotExist:
            return Response({
                'success': True,
                'data': None,
                'message': 'No salary configuration found for this employee'
            })
            
    except Exception as e:
        logger.error(f"Error fetching employee salary: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch salary data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# View to get current user's organization info
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_organization(request):
    """
    Get current user's organization details
    """
    try:
        user = request.user
        
        if not user.organization:
            return Response({
                'success': False,
                'error': 'User is not associated with any organization'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        organization = user.organization
        
        return Response({
            'success': True,
            'organization': {
                'id': organization.id,
                'name': organization.name,
                'type': organization.organization_type,
                'code': organization.code,
                'email': organization.email,
                'phone': organization.phone,
                'address': organization.address,
                'is_active': organization.is_active
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching organization: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if not hasattr(user, 'organization') or not user.organization:
            return Response({"detail": "No organization found."}, status=403)

        organization = user.organization

        queryset = Attendance.objects.filter(organization=organization)

        # Regular employees see only their own attendance
        if user.role not in ['admin', 'hr', 'sub_org_admin']:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                return Response({"detail": "No employee profile found."}, status=404)

        queryset = queryset.select_related('employee').order_by('-date', '-punch_in')

        serializer = AttendanceSerializer(queryset, many=True)
        return Response(serializer.data)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def late_punch_requests(request):
    user = request.user
    
    # Check if user has an organization
    if not hasattr(user, 'organization') or not user.organization:
        return Response({"detail": "No organization found for this user."}, status=403)

    org = user.organization

    # Fetch all pending late punch requests in the organization
    queryset = LatePunchRequest.objects.filter(
        attendance__organization=org,
        status="PENDING"
    ).select_related('attendance__employee')

    serializer = LatePunchRequestSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def handle_late_request(request, pk):
    user = request.user
    
    try:
        lpr = LatePunchRequest.objects.get(pk=pk)
    except LatePunchRequest.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    # Ensure user is in the same organization
    if not hasattr(user, 'organization') or not user.organization:
        return Response({"detail": "No organization found."}, status=403)

    if lpr.attendance.organization != user.organization:
        return Response({"detail": "Unauthorized: Not in the same organization."}, status=403)

    # Your existing action logic
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
        lpr.attendance.status = "LEAVE"  # or "ABSENT" based on your policy
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
    user = request.user
    
    # Check if user has an organization
    if not hasattr(user, 'organization') or not user.organization:
        return Response({"detail": "No organization found for this user."}, status=403)

    org = user.organization

    month = request.GET.get("month")  
    if not month:
        return Response({"detail": "Month required (YYYY-MM)"}, status=400)

    try:
        year, month_num = map(int, month.split("-"))
    except ValueError:
        return Response({"detail": "Invalid month format. Use YYYY-MM"}, status=400)

    from django.db.models import Count, Q

    report = Attendance.objects.filter(
        organization=org,
        date__year=year,
        date__month=month_num
    ).values("employee__full_name").annotate(
        present=Count("id", filter=Q(status="PRESENT")),
        late=Count("id", filter=Q(is_late=True)),
        leave=Count("id", filter=Q(status="LEAVE"))
    )

    data = [
        {
            "employee_name": r["employee__full_name"],
            "present": r["present"],
            "late": r["late"],
            "leave": r["leave"]
        }
        for r in report
    ]

    return Response(data)
class JobOpeningViewSet(viewsets.ModelViewSet):
    serializer_class = JobOpeningSerializer
    permission_classes = [AllowAny]
    queryset=JobOpening.objects.all()
    def get_queryset(self):
        user = self.request.user
        return JobOpening.objects.all()

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def perform_update(self, serializer):
        serializer.save(organization=self.request.user.organization)

class ReferralViewSet(viewsets.ModelViewSet):
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Referral.objects.all()

    def get(self, request):
        user = request.user

    # Ensure user has an organization
        if not hasattr(user, 'organization') or not user.organization:
            return Response({"detail": "No organization found."}, status=403)

        organization = user.organization
        queryset = Referral.objects.filter(
            job_opening__organization=organization
        ).select_related('referred_by', 'job_opening', 'candidate')
        if user.role not in ['admin', 'hr', 'sub_org_admin']:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(referred_by=employee)
            except Employee.DoesNotExist:
                return Response({"detail": "No employee profile found."}, status=404)
        queryset = queryset.order_by('-created_at')  # or '-referred_at' if you have that field
        serializer = ReferralSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)
    @action(detail=True, methods=["patch"], url_path="update-status")
    def update_status(self, request, pk=None):
        referral = self.get_object()
        status_value = request.data.get("status")
        if not status_value:
            return Response(
                {"status": "This field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        referral.status = status_value
        referral.save()
        return Response(
            {"message": "Status updated successfully"},
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=["post"], url_path="send-offer")
    def send_offer(self, request, pk=None):
        referral = self.get_object()
        if referral.status != "selected":
            return Response(
                {"detail": "Offer can be sent only for selected candidates"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            send_offer_email(referral)
            referral.save(update_fields=["status"])  # remove if not changing status
            return Response(
                {"message": "Offer letter emailed successfully!"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(f"Failed to send offer email: {e}")
            return Response(
                {"detail": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_direct_offer(request):
    job_id = request.data.get('job_opening_id')
    name = request.data.get('candidate_name')
    email = request.data.get('candidate_email')
    phone = request.data.get('candidate_phone')
    notes = request.data.get('notes', '')
    if not all([job_id, name, email]):
        return Response({"detail": "Missing required fields"}, status=400)
    try:
        job = JobOpening.objects.get(id=job_id)
    except JobOpening.DoesNotExist:
        return Response({"detail": "Job opening not found"}, status=404)
    class FakeReferral:
        candidate_name = name
        candidate_email = email
        job_opening = job
    send_offer_email(FakeReferral())
    return Response({"message": "Direct offer sent successfully!"}, status=200)

def generate_offer_letter_pdf(referral):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width / 2, height - 2 * cm, "OFFER LETTER")
    p.setFont("Helvetica", 12)
    y = height - 5 * cm
    p.drawString(2 * cm, y, f"Date: {timezone.now().strftime('%B %d, %Y')}")
    y -= 1.5 * cm
    p.drawString(2 * cm, y, f"Dear {referral.candidate_name},")
    y -= 2 * cm
    p.drawString(2 * cm, y, "We are pleased to extend an offer for the position of")
    p.setFont("Helvetica-Bold", 14)
    p.drawString(2 * cm, y - 0.8 * cm, referral.job_opening.title)
    p.setFont("Helvetica", 12)
    y -= 3 * cm

    p.drawString(2 * cm, y, "at our organization.")
    y -= 1.5 * cm

    p.drawString(2 * cm, y, "Please find the detailed terms in the attached document.")
    y -= 2 * cm

    p.drawString(2 * cm, y, "We look forward to welcoming you to the team.")
    y -= 2 * cm

    p.drawString(2 * cm, y, "Best regards,")
    y -= 1 * cm
    p.drawString(2 * cm, y, settings.COMPANY_NAME if hasattr(settings, 'COMPANY_NAME') else "HR Team")
    y -= 0.8 * cm
    p.drawString(2 * cm, y, settings.COMPANY_EMAIL if hasattr(settings, 'COMPANY_EMAIL') else "hr@company.com")

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer

def send_offer_email(referral):
    candidate_email = referral.candidate_email
    candidate_name = referral.candidate_name
    job_title = referral.job_opening.title

    subject = f"Job Offer – {job_title}"
    body = f"""
    Dear {candidate_name},

    Congratulations! We are excited to extend a formal job offer for the position of **{job_title}**.

    Please find the official offer letter attached to this email.

    Kindly review the terms and let us know your acceptance at your earliest convenience.

    Best regards,  
    HR Team  
    {getattr(settings, 'COMPANY_NAME', 'Your Company')}
    """

    # Generate PDF
    pdf_buffer = generate_offer_letter_pdf(referral)

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'hr@yourcompany.com'),
        to=[candidate_email],
    )

    email.attach(
        filename=f"Offer_Letter_{candidate_name.replace(' ', '_')}_{job_title.replace(' ', '_')}.pdf",
        content=pdf_buffer.getvalue(),
        mimetype='application/pdf'
    )

    email.send(fail_silently=False)

    print(f"Offer email sent to {candidate_name} ({candidate_email}) for {job_title}")

    return Response(data)
