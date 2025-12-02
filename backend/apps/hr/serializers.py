# apps/hr/serializers.py

from rest_framework import serializers
from .models import Department, Designation, Employee, EmployeeDocument


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