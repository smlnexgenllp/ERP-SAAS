# apps/hr/serializers.py

from rest_framework import serializers
from .models import Department, Designation, Employee, EmployeeDocument,Salary,Invoice,Task, TaskUpdate, DailyChecklist,Project,ChatGroup, Message
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


class EmployeeSerializer(serializers.ModelSerializer):
    # Send full nested objects instead of just IDs
    department = DepartmentSerializer(read_only=True)
    designation = DesignationSerializer(read_only=True)

    # Allow creating/updating with IDs (write-only)
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

    # Nice human-readable role (Admin / HR / Employee)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'employee_code', 'email', 'phone',
            'role', 'role_display',                    # ← MUST be in fields!
            'department', 'department_id',
            'designation', 'designation_id',
            'date_of_joining', 'date_of_birth',
            'is_active', 'is_probation', 'ctc', 'photo',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'employee_code', 'role_display']

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
class OrgTreeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name')
    title = serializers.CharField(source='designation.title', allow_null=True, default=None)
    department = serializers.CharField(source='department.name', allow_null=True, default=None)
    employee_code = serializers.CharField(allow_null=True, default=None)
    photo = serializers.SerializerMethodField()
    is_active = serializers.BooleanField()

    children = serializers.SerializerMethodField()

# class LeaveRequestSerializer(serializers.ModelSerializer):
# class Meta:
# model = LeaveRequest
# fields = '__all__'
# read_only_fields = ['requested_at', 'reviewed_at']

# apps/hr/serializers.py


# apps/hr/serializers.py
class OrgTreeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name')
    title = serializers.CharField(source='designation.title', allow_null=True, default=None)
    department = serializers.CharField(source='department.name', allow_null=True, default=None)
    employee_code = serializers.CharField(allow_null=True, default=None)
    photo = serializers.SerializerMethodField()
    is_active = serializers.BooleanField()

    children = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'name', 'title', 'department', 'employee_code', 'photo', 'is_active', 'children']

    def get_photo(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None

    def get_children(self, obj):
        children = obj.subordinates.filter(is_active=True).order_by('full_name')
        return OrgTreeSerializer(children, many=True, context=self.context).data
    

class EmployeeCreateInvitationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(write_only=True, required=True)
    full_name = serializers.CharField(required=True)

    class Meta:
        model = EmployeeInvite
        fields = [
            'full_name', 'user_email', 'phone', 'role',
            'department', 'designation', 'date_of_joining', 'is_probation',
            'ctc', 'notes'
        ]

    def validate_user_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        if EmployeeInvite.objects.filter(email=value).exists():
            raise serializers.ValidationError("An invitation has already been sent to this email.")
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')

        email = validated_data.pop('user_email')
        full_name = validated_data.pop('full_name')

        # Determine which organization the invite belongs to
        # Best: from logged-in user's employee profile
        if request and hasattr(request.user, "employee"):
            organization = request.user.employee.organization
        else:
            # Fallback (you may change this)
            organization = Organization.objects.first()

        # Allowed invite fields
        allowed_fields = [
            'phone', 'role', 'department', 'designation',
            'date_of_joining', 'is_probation', 'ctc', 'notes'
        ]
        invite_data = {k: validated_data[k] for k in allowed_fields if k in validated_data}

        # Create the invite (🔥 ORGANIZATION ADDED)
        invite = EmployeeInvite.objects.create(
            full_name=full_name,
            email=email,
            organization=organization,   # ← FIXED
            **invite_data
        )

        # Accept URL
        accept_url = f"http://{request.get_host()}/api/hr/employees/accept-invite/{invite.token}/"

        # HTML email
        html_message = render_to_string(
            'emails/invitation_email.html',
            {
                'full_name': full_name,
                'organization': organization.name,
                'accept_url': accept_url
            }
        )

        # Send the email
        send_mail(
            subject=f"Invitation to join {organization.name}",
            message='',
            html_message=html_message,
            from_email=None,
            recipient_list=[email],
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

class SimpleUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "email"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class EmployeeReimbursementSerializer(serializers.ModelSerializer):
    employee = SimpleUserSerializer(read_only=True)
    manager = SimpleUserSerializer(read_only=True)

    class Meta:
        model = EmployeeReimbursement
        fields = ["id", "employee", "manager", "amount", "date", "reason", "status"]


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
from .models import JobOpening, Referral


class JobOpeningSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOpening
        fields = "__all__"
        read_only_fields = ["organization", "created_at"]

class ReferralSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job_opening.title", read_only=True)
    referred_by_name = serializers.CharField(source="referred_by.username", read_only=True)

    class Meta:
        model = Referral
        fields = "__all__"
        read_only_fields = ["referral_id", "status", "referred_by"]

class TaskUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True)

    class Meta:
        model = TaskUpdate
        fields = ['id', 'change_description', 'old_progress', 'new_progress', 'updated_by_name', 'timestamp']


# apps/hr/serializers.py
class TaskSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.CharField(source='assigned_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'assigned_by', 'assigned_by_name',
            'assigned_to', 'assigned_to_name', 'deadline', 'progress_percentage',
            'is_completed', 'created_at', 'updated_at',
            'project', 'project_name', 'organization'
        ]
        read_only_fields = ['created_at', 'updated_at', 'organization']


class TaskProgressUpdateSerializer(serializers.Serializer):
    progress_percentage = serializers.IntegerField(min_value=0, max_value=100, required=False)
    change_description = serializers.CharField(max_length=1000, required=True)
    is_completed = serializers.BooleanField(required=False)


class DailyChecklistSerializer(serializers.ModelSerializer):
    for_employee_name = serializers.CharField(source='for_employee.full_name', read_only=True)
    set_by_name = serializers.CharField(source='set_by.full_name', read_only=True)
    rated_by_name = serializers.CharField(source='rated_by.full_name', read_only=True)

    class Meta:
        model = DailyChecklist
        fields = [
            'id', 'date', 'for_employee', 'for_employee_name',
            'goals_description', 'set_by', 'set_by_name',
            'rating', 'rated_by', 'rated_by_name', 'comments'
        ]      

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