# apps/hr/serializers.py

from rest_framework import serializers
from .models import Department, Designation, Employee, EmployeeDocument,Salary,Invoice,Task, TaskUpdate, DailyChecklist,Project,ChatGroup, Message,DailyTLReport
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.organizations.models import Organization
from .models import EmployeeInvite
from django.template.loader import render_to_string
from django.core.mail import send_mail
from .utils import get_project_member_ids
User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code']
class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ['id', 'title', 'grade']


# apps/hr/serializers.py

class EmployeeSerializer(serializers.ModelSerializer):
    # Nested full objects
    department = DepartmentSerializer(read_only=True)
    designation = DesignationSerializer(read_only=True)

    # Write-only IDs for create/update
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )
    designation_id = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(),
        source='designation',
        write_only=True,
        required=False,
        allow_null=True
    )

    # Human-readable role
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    # NEW: Reporting manager details
    reporting_to_name = serializers.CharField(source='reporting_to.full_name', read_only=True, allow_null=True)
    reporting_to_code = serializers.CharField(source='reporting_to.employee_code', read_only=True, allow_null=True)
    reporting_to_id = serializers.IntegerField(source='reporting_to.id', read_only=True, allow_null=True)

    # NEW: Subordinates (team members) - for fetching their tasks
    subordinates = serializers.SerializerMethodField()

    def get_subordinates(self, obj):
        return [
            {
                'id': sub.id,
                'full_name': sub.full_name,
                'employee_code': sub.employee_code or '',
            }
            for sub in obj.subordinates.select_related().all()
        ]

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'employee_code', 'email', 'phone',
            'role', 'role_display',
            'department', 'department_id',
            'designation', 'designation_id',
            'reporting_to', 'reporting_to_id', 'reporting_to_name', 'reporting_to_code',  # ← ADD THESE
            'subordinates',  # ← ADD THIS
            'date_of_joining', 'date_of_birth',
            'is_active', 'is_probation', 'ctc', 'photo',
            'notes', 'created_at', 'updated_at', 'reporting_to',"reporting_to_name"
        ]
        read_only_fields = ['created_at', 'updated_at', 'employee_code', 'role_display']
    def get_reporting_to_name(self, obj):
        return obj.reporting_to.full_name if obj.reporting_to else None
# Add this at the bottom of serializers.py

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = ['id', 'title', 'file', 'file_url', 'uploaded_at']
        read_only_fields = ['uploaded_at', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


from rest_framework import serializers
from apps.hr.models import Employee

class OrgTreeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name')
    title = serializers.CharField(source='designation.title', allow_null=True, default=None)
    department = serializers.CharField(source='department.name', allow_null=True, default=None)
    photo = serializers.ImageField(allow_null=True, required=False)
    employee_code = serializers.CharField(allow_null=True, required=False)
    email = serializers.EmailField(source='user.email', allow_null=True, read_only=True)
    phone = serializers.CharField(allow_null=True)
    role = serializers.CharField()
    date_of_joining = serializers.DateField(allow_null=True)
    date_of_birth = serializers.DateField(allow_null=True)
    is_active = serializers.BooleanField()
    is_probation = serializers.BooleanField()
    ctc = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    notes = serializers.CharField(allow_blank=True, default="")
    is_logged_in = serializers.BooleanField()

    # Recursive field for children
    children = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'name', 'title', 'department', 'photo', 'employee_code',
            'email', 'phone', 'role', 'date_of_joining', 'date_of_birth',
            'is_active', 'is_probation', 'ctc', 'notes', 'is_logged_in',
            'children'
        ]

    def get_debug_fields(self, obj):
        """Debug helper to see what fields exist on the object"""
        fields = []
        for attr in ['email', 'work_email', 'official_email', 
                     'phone', 'work_phone', 'office_phone',
                     'mobile', 'mobile_number', 'cell_phone',
                     'location', 'work_location']:
            if hasattr(obj, attr):
                value = getattr(obj, attr)
                fields.append(f"{attr}: {value}")
        return ", ".join(fields) if fields else "No contact fields found"

    def get_children(self, obj):
        # Get direct reports
        reports = Employee.objects.filter(
            reporting_to=obj,
            is_active=True
        ).select_related('designation', 'department')

        # Recursively serialize them
        return OrgTreeSerializer(reports, many=True, context=self.context).data
class EmployeeCreateInvitationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(write_only=True, source='email')
    full_name = serializers.CharField(required=True)

    class Meta:
        model = EmployeeInvite
        fields = [
            'full_name', 'user_email', 'phone', 'role',
            'department', 'designation', 'date_of_joining',
            'is_probation', 'ctc', 'notes', 'reporting_to'
        ]

    def validate_user_email(self, value):
        request = self.context.get('request')
        organization = getattr(request.user.employee, 'organization', None)

        if organization:
            EmployeeInvite.objects.filter(
                email=value,
                organization=organization,
                is_accepted=False
            ).delete()

        return value.lower()


    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')

        if request and hasattr(request.user, 'employee'):
            org = request.user.employee.organization
            fields['department'].queryset = Department.objects.filter(organization=org)
            fields['designation'].queryset = Designation.objects.filter(organization=org)

        return fields

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')

        if not request or not hasattr(request.user, 'employee'):
            raise serializers.ValidationError("Unable to determine organization.")

        organization = request.user.employee.organization

        invite = EmployeeInvite.objects.create(
            organization=organization,
            **validated_data
        )

        scheme = 'https' if request.is_secure() else 'http'
        accept_url = f"{scheme}://{request.get_host()}/api/hr/employees/accept-invite/{invite.token}/"

        html_message = render_to_string(
            'emails/invitation_email.html',
            {
                'full_name': invite.full_name,
                'organization': organization.name,
                'accept_url': accept_url
            }
        )

        send_mail(
            subject=f"Invitation to join {organization.name}",
            message='',
            html_message=html_message,
            from_email=None,
            recipient_list=[invite.email],
            fail_silently=False
        )

        return invite

    

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import LeaveRequest, PermissionRequest


class SimpleUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'first_name', 'last_name', 'email')

    def get_full_name(self, obj):
        return f"{getattr(obj,'first_name','') or ''} {getattr(obj,'last_name','') or ''}".strip() or obj.username

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = SimpleUserSerializer(read_only=True)
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = LeaveRequest
        fields = ('id','employee','leave_type','start_date','end_date','reason','manager','manager_id','status','applied_at','responded_at','response_note')
        read_only_fields = ('status','applied_at','responded_at','response_note','manager')

    def create(self, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        request = self.context['request']

    # Set employee = Employee.user?
        validated_data['employee'] = request.user

        if manager_id:
            try:
                mgr = User.objects.get(pk=manager_id)
            except User.DoesNotExist:
                mgr = None
            validated_data['manager'] = mgr

        return super().create(validated_data)


class LeaveRequestUpdateSerializer(serializers.ModelSerializer):
    # used by managers to approve/reject
    status = serializers.ChoiceField(choices=LeaveRequest._meta.get_field('status').choices)
    response_note = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = LeaveRequest
        fields = ('status','response_note')

class PermissionRequestSerializer(serializers.ModelSerializer):
    employee = SimpleUserSerializer(read_only=True)
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = PermissionRequest
        fields = ('id','employee','date','time_from','time_to','reason','manager','manager_id','status','applied_at','responded_at','response_note')
        read_only_fields = ('status','applied_at','responded_at','response_note','manager')

    def create(self, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        request = self.context['request']
        validated_data['employee'] = request.user
        if manager_id:
            from django.contrib.auth import get_user_model
            try:
                mgr = get_user_model().objects.get(pk=manager_id)
            except get_user_model().DoesNotExist:
                mgr = None
            validated_data['manager'] = mgr
        return super().create(validated_data)

class PermissionRequestUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=PermissionRequest._meta.get_field('status').choices)
    response_note = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = PermissionRequest
        fields = ('status','response_note')

from .models import EmployeeReimbursement


from rest_framework import serializers
from apps.hr.models import EmployeeReimbursement, Employee
from django.contrib.auth import get_user_model

User = get_user_model()


class EmployeeReimbursementSerializer(serializers.ModelSerializer):
    employee = SimpleUserSerializer(read_only=True)
    manager = SimpleUserSerializer(read_only=True)

    # Write-only field for frontend to send manager ID
    manager_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = EmployeeReimbursement
        fields = [
            "id", "employee", "manager", "manager_id",
            "amount", "date", "reason", "status"
        ]
        read_only_fields = ["employee", "status"]

    def validate_manager_id(self, manager_id):
        """
        Validate that the selected manager is the employee's direct reporting manager
        """
        request = self.context['request']
        user = request.user

        try:
            employee_profile = Employee.objects.select_related('reporting_to').get(user=user)
        except Employee.DoesNotExist:
            raise serializers.ValidationError(
                "Your employee profile is not set up. Please contact HR."
            )

        if not employee_profile.reporting_to:
            raise serializers.ValidationError(
                "You do not have a reporting manager assigned. Please contact HR."
            )

        reporting_manager_user = employee_profile.reporting_to.user

        if not reporting_manager_user:
            raise serializers.ValidationError(
                "Your reporting manager does not have an active account."
            )

        if manager_id != reporting_manager_user.id:
            raise serializers.ValidationError(
                f"You can only submit reimbursement requests to your assigned reporting manager: "
                f"{employee_profile.reporting_to.full_name}."
            )

        return manager_id

    def create(self, validated_data):
        validated_data.pop('manager_id', None)
        return super().create(validated_data)
class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)

    effective_date = serializers.DateField(
        input_formats=["%Y-%m-%d"],
        required=True
    )

    class Meta:
        model = Salary
        fields = '__all__'
        read_only_fields = [
            'total_allowances', 'gross_salary', 'total_deductions', 'net_salary',
            'esi_employee_amount', 'esi_employer_amount', 'pf_employee_amount',
            'pf_employer_amount', 'pf_voluntary_amount', 'created_at', 'updated_at'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    month_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'generated_date', 'created_at', 'updated_at']
    
    def get_month_name(self, obj):
        from datetime import datetime
        return datetime.strptime(str(obj.month), "%m").strftime("%B")
# apps/hr/serializers.py
from rest_framework import serializers
from apps.hr.models import LatePunchRequest

# apps/hr/serializers.py

class LatePunchRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="attendance.employee.full_name", read_only=True)
    date = serializers.DateField(source="attendance.date", read_only=True)
    reason = serializers.CharField(source="attendance.late_request.reason", read_only=True)

    class Meta:
        model = LatePunchRequest
        fields = ["id", "employee_name", "date", "reason"]
from rest_framework import serializers
from apps.hr.models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = Attendance
        fields = ["id", "employee_name", "date", "punch_in", "punch_out", "status", "is_late"]

from rest_framework import serializers
from apps.organizations.models import Organization, OrganizationBranding
from apps.hr.models import JobOpening, Referral
class OrganizationNestedSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(source='branding.logo', read_only=True, allow_null=True)
    hr_email = serializers.EmailField(source='branding.hr_email', read_only=True, allow_null=True)
    hr_contact_name = serializers.CharField(source='branding.hr_contact_name', read_only=True, allow_null=True)
    website = serializers.URLField(source='branding.website', read_only=True, allow_null=True)
    class Meta:
        model = Organization
        fields = ['id', 'name', 'logo', 'hr_email', 'hr_contact_name', 'website']
        read_only_fields = fields
        
class JobOpeningNestedSerializer(serializers.ModelSerializer):
    organization = OrganizationNestedSerializer(read_only=True)
    class Meta:
        model = JobOpening
        fields = ['id', 'title', 'description', 'organization']
class JobOpeningSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOpening
        fields = "__all__"
        read_only_fields = ["organization", "created_at"]
class ReferralSerializer(serializers.ModelSerializer):
    job_opening = JobOpeningNestedSerializer(read_only=True)
    job_title = serializers.CharField(source="job_opening.title", read_only=True)
    referred_by_name = serializers.CharField(source="referred_by.get_full_name", read_only=True)
    referred_by_email = serializers.EmailField(source="referred_by.email", read_only=True)
    class Meta:
        model = Referral
        fields = "__all__"
        read_only_fields = ["referral_id", "status", "referred_by"]


# apps/hr/serializers.py

class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for TaskUpdate (audit log entries)
    Shows who updated, when, and what changed
    """
    updated_by_name = serializers.CharField(
        source='updated_by.full_name',
        read_only=True,
        allow_null=True  # In case employee was deleted (SET_NULL)
    )

    class Meta:
        model = TaskUpdate
        fields = [
            'id',
            'change_description',
            'old_progress',
            'new_progress',
            'timestamp',
            'updated_by_name',
        ]
        read_only_fields = fields  # Everything is read-only


class TaskSerializer(serializers.ModelSerializer):
    """
    Main Task serializer used in list/detail views and TaskCard
    """
    assigned_by_name = serializers.CharField(
        source='assigned_by.full_name',
        read_only=True,
        allow_null=True
    )
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name',
        read_only=True,
        allow_null=True
    )
    project_name = serializers.CharField(
        source='project.name',
        read_only=True,
        allow_null=True
    )

    # This includes all audit log updates (newest first due to model ordering)
    updates = TaskUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'assigned_by',
            'assigned_by_name',
            'assigned_to',
            'assigned_to_name',
            'deadline',
            'progress_percentage',
            'is_completed',
            'created_at',
            'updated_at',
            'project',
            'project_name',
            'organization',
            'updates',  # Critical: now included!
        ]
        read_only_fields = [
    'created_at',
    'updated_at',
    'updates',
    'assigned_by',
    'organization',     # 🔥 THIS FIXES YOUR ERROR
    'assigned_by_name',
    'assigned_to_name',
    'project_name',
]




class TaskProgressUpdateSerializer(serializers.Serializer):
    progress_percentage = serializers.IntegerField(min_value=0, max_value=100, required=False)
    change_description = serializers.CharField(max_length=1000, required=True)
    is_completed = serializers.BooleanField(required=False)
    


class DailyChecklistSerializer(serializers.ModelSerializer):
    for_employee_name = serializers.CharField(source='for_employee.full_name', read_only=True)
    set_by_name = serializers.CharField(source='set_by.full_name', read_only=True, allow_null=True)
    
    today_task_updates = serializers.SerializerMethodField()

    def get_today_task_updates(self, obj):
        from apps.hr.models import TaskUpdate
        from django.utils import timezone
        
        today = timezone.now().date()
        updates = TaskUpdate.objects.filter(
            task__assigned_to=obj.for_employee,
            timestamp__date=today
        ).select_related('task').order_by('-timestamp')[:10]

        return [
            {
                "task_title": u.task.title,
                "change_description": u.change_description,
                "progress": f"{u.old_progress}% → {u.new_progress}%",
                "timestamp": u.timestamp.strftime("%H:%M")
            }
            for u in updates
        ]

    class Meta:
        model = DailyChecklist
        fields = ['id', 'date', 'goals_description', 'set_by_name', 'for_employee_name', 'today_task_updates', 'rating']

# serializers.py
class ProjectSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Employee.objects.all(),
        required=False
    )

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'members', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        project = super().create(validated_data)
        if members:
            project.members.set(members)
        return project
    
from rest_framework import serializers
from apps.hr.models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    month_name = serializers.CharField(source='get_month_name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'employee', 'employee_name', 'employee_code',
            'month', 'year', 'month_name',
            'basic_salary', 'hra', 'medical_allowance', 'conveyance_allowance',
            'special_allowance', 'other_allowances',
            'professional_tax', 'income_tax', 'other_deductions',
            'esi_employee_amount', 'pf_employee_amount', 'pf_voluntary_amount',
            'total_allowances', 'total_deductions',
            'gross_salary', 'net_salary',
            'status', 'generated_date', 'paid_date',
            'notes'
        ]
        read_only_fields = ['invoice_number', 'generated_date']

class UserChatSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='employee.full_name', read_only=True)
    photo = serializers.ImageField(source='employee.photo', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'photo']


class ChatGroupSerializer(serializers.ModelSerializer):
    unread_count = serializers.IntegerField(read_only=True, default=0)
    project_name = serializers.CharField(source='project.name', read_only=True)
    member_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = ChatGroup
        fields = [
            'id', 'name', 'group_type', 'organization', 'project',
            'project_name', 'unread_count',
            'member_count', 'last_message',
            'members', 'created_at'
        ]

    def get_member_count(self, obj):
        return obj.get_members().count()

    def get_members(self, obj):
        members_qs = obj.get_members()

        return [
            {
                'id': user.id,
                'email': user.email or '',
                'full_name': (
                    user.employee.full_name
                    if hasattr(user, 'employee') and user.employee
                    else user.email
                ),
                'employee_id': user.employee.id if hasattr(user, 'employee') and user.employee else None,
                'department': (
                    user.employee.department.name
                    if hasattr(user, 'employee') and user.employee and user.employee.department
                    else None
                ),
                'photo': (
                    user.employee.photo.url
                    if hasattr(user, 'employee') and user.employee and user.employee.photo
                    else None
                ),
            }
            for user in members_qs
        ]

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if not last_msg:
            return None

        return {
            'content': last_msg.content[:50] + '...' if len(last_msg.content) > 50 else last_msg.content,
            'sender': last_msg.sender.email,
            'timestamp': last_msg.timestamp
        }


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'group', 'sender', 'content', 'file', 'file_url',
            'timestamp', 'is_private'
        ]
        read_only_fields = ['sender', 'timestamp']
    
    def get_sender(self, obj):
        user = obj.sender
        employee = getattr(user, 'employee', None)  # Safe access
        
        return {
            'id': user.id,
            'email': user.email,
            'full_name': employee.full_name if employee else user.email,
            'photo': employee.photo.url if employee and employee.photo else None,
        }
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

# apps/hr/serializers.py

class DailyTLReportSerializer(serializers.ModelSerializer):
    team_lead_name = serializers.CharField(source='team_lead.full_name', read_only=True)
    team_lead_code = serializers.CharField(source='team_lead.employee_code', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    manager_code = serializers.CharField(source='manager.employee_code', read_only=True)

    class Meta:
        model = DailyTLReport
        fields = [
            'id', 'organization', 'team_lead', 'team_lead_name', 'team_lead_code',
            'manager', 'manager_name', 'manager_code',
            'date', 'report_summary', 'data', 'sent_at', 'is_submitted'
        ]
        read_only_fields = ['manager', 'sent_at', 'team_lead', 'organization']