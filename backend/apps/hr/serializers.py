# apps/hr/serializers.py

from rest_framework import serializers
from .models import Department, Designation, Employee, EmployeeDocument
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.organizations.models import Organization
from .models import EmployeeInvite
from django.template.loader import render_to_string
from django.core.mail import send_mail

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
    

User = get_user_model()




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
