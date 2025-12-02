from rest_framework import serializers
from .models import (
    Department, Designation, Employee)
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'

# class EmployeeDocumentSerializer(serializers.ModelSerializer):
# class Meta:
# model = EmployeeDocument
# fields = [
# 'id', 'organization', 'user', 'full_name', 'employee_code', 'email', 'phone',
# 'role', 'reporting_to','id', 'title', 'file', 'uploaded_at']
# read_only_fields = ['uploaded_at']

# class EmployeeBankInfoSerializer(serializers.ModelSerializer):
# class Meta:
# model = EmployeeBankInfo
# fields = '__all__'
# read_only_fields = ['updated_at']

class EmployeeSerializer(serializers.ModelSerializer):
    # documents = EmployeeDocumentSerializer(many=True, read_only=True)
    # bank_info = EmployeeBankInfoSerializer(read_only=True)
    class Meta:
        model = Employee
        fields = [
            'id', 'organization', 'user', 'full_name', 'employee_code', 'email', 'phone',
            'department', 'designation', 'date_of_joining', 'date_of_birth', 'is_active',
            'is_probation', 'ctc', 'photo', 'notes', 'created_at', 'updated_at',
            'documents', 'bank_info'
        ]
        read_only_fields = ['created_at', 'updated_at', 'employee_code']




# class AttendanceSerializer(serializers.ModelSerializer):
# class Meta:
# model = Attendance
# fields = '__all__'




# class LeaveTypeSerializer(serializers.ModelSerializer):
# class Meta:
# model = LeaveType
# fields = '__all__'




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