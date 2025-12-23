# apps/hr/views/employee_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view,permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
User = get_user_model()        

from django.db import transaction

from apps.hr.models import Department, Designation, Employee, EmployeeDocument, EmployeeInvite, Salary, Invoice
from apps.hr.serializers import (
    DepartmentSerializer,
    DesignationSerializer,
    EmployeeSerializer,
    EmployeeDocumentSerializer,
    EmployeeCreateInvitationSerializer,
    SalarySerializer, InvoiceSerializer
)
import logging

logger = logging.getLogger(__name__)

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
        # Use exact lowercase roles from DB
        manager_roles = ["hr", "admin"]  # include hr and admin if they are managers
        managers = Employee.objects.filter(
            organization=org,
            role__in=manager_roles,
            is_active=True
        ).exclude(user=current_employee.user)
        return User.objects.filter(employee__in=managers)
class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().select_related('employee','manager')
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    def get_serializer_class(self):
        if self.action in ['update','partial_update','approve','reject']:
            return LeaveRequestUpdateSerializer
        return LeaveRequestSerializer
    def get_serializer_context(self):
        # Important to pass request so serializer can set employee
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    def get_queryset(self):
            user = self.request.user
            admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]
            queryset = LeaveRequest.objects.select_related('employee', 'manager')
            if user.role in admin_roles or user.is_staff or user.is_superuser:
                return queryset.all()
            return queryset.filter(employee=user)
    def perform_create(self, serializer):
        serializer.save()
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def approve(self, request, pk=None):
        obj = self.get_object()
        # if not request.user.is_staff and not request.user.is_superuser:
        #     return Response({"detail":"Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        obj.status = 'approved'
        obj.response_note = request.data.get('response_note','')
        obj.responded_at = timezone.now()
        obj.save()
        return Response(LeaveRequestSerializer(obj, context={'request': request}).data)
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def reject(self, request, pk=None):
        obj = self.get_object()
        # if not request.user.is_staff and not request.user.is_superuser:
        #     return Response({"detail":"Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        obj.status = 'rejected'
        obj.response_note = request.data.get('response_note','')
        obj.responded_at = timezone.now()
        obj.save()
        return Response(LeaveRequestSerializer(obj, context={'request': request}).data)
class PermissionRequestViewSet(viewsets.ModelViewSet):
    queryset = PermissionRequest.objects.all().select_related('employee', 'manager')
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update', 'approve', 'reject']:
            return PermissionRequestUpdateSerializer
        return PermissionRequestSerializer
    def get_queryset(self):
        user = self.request.user
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]
        queryset = PermissionRequest.objects.select_related('employee', 'manager')
        if user.role in admin_roles or user.is_staff or user.is_superuser:
            return queryset.all()
        return queryset.filter(employee=user)
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def approve(self, request, pk=None):
        obj = self.get_object()
        emp = getattr(request.user, "employee", None)
        # Allow Admin + HR + Manager
        # if not (emp and emp.role in ["admin", "hr", "manager"]):
        #     return Response({"detail": "Not allowed"}, status=403)
        obj.status = 'approved'
        obj.response_note = request.data.get('response_note', '')
        obj.responded_at = timezone.now()
        obj.save()
        return Response(PermissionRequestSerializer(obj, context={'request': request}).data)
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def reject(self, request, pk=None):
        obj = self.get_object()
        emp = getattr(request.user, "employee", None)
        # if not (request.user.is_staff or (emp and emp.role in ["admin", "hr"])):
        #     return Response({"detail":"Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        obj.status = 'rejected'
        obj.response_note = request.data.get('response_note','')
        obj.responded_at = timezone.now()
        obj.save()
        return Response(PermissionRequestSerializer(obj, context={'request': request}).data)
from rest_framework.views import APIView
class ManagerLeaveList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        leaves = LeaveRequest.objects.filter(
            manager=request.user,
            status="pending"
        ).select_related("employee")
        return Response(LeaveRequestSerializer(leaves, many=True).data)
    
class ManagerPermissionList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        permissions = PermissionRequest.objects.filter(
            manager=user,
            status="pending"
        ).select_related("employee")
        return Response(PermissionRequestSerializer(permissions, many=True).data)
    
from rest_framework import viewsets, status
from apps.hr.models import EmployeeReimbursement
from apps.hr.serializers import EmployeeReimbursementSerializer
from rest_framework.decorators import action
class EmployeeReimbursementViewSet(viewsets.ModelViewSet):
    queryset = EmployeeReimbursement.objects.all()
    serializer_class = EmployeeReimbursementSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]
        queryset = EmployeeReimbursement.objects.select_related('employee', 'manager')
        if user.role in admin_roles or user.is_staff or user.is_superuser:
            return queryset.all()
        return queryset.filter(employee=user)
    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        reimbursement = self.get_object()
        reimbursement.status = "approved"
        reimbursement.save()
        return Response(
            {"message": "Reimbursement approved"},
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        reimbursement = self.get_object()
        reimbursement.status = "rejected"
        reimbursement.save()
        return Response(
            {"message": "Reimbursement rejected"},
            status=status.HTTP_200_OK
        )

# Even simpler version to avoid errors
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_organization_employees(request):
    """Get employees from user's organization - Simplified"""
    try:
        user = request.user
        
        if not user.organization:
            return Response({
                'success': False,
                'error': 'User is not associated with any organization'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        organization = user.organization
        
        # Simple query without complex joins
        employees = Employee.objects.filter(
            organization=organization,
            is_active=True
        ).only('id', 'full_name', 'employee_code', 'email', 'designation', 'department')
        
        data = []
        for emp in employees:
            # Handle designation safely
            designation_title = None
            if emp.designation:
                designation_title = emp.designation.title
                
            # Handle department safely
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
    """
    Set or update salary for an employee
    Only allow setting salary for employees in user's organization
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