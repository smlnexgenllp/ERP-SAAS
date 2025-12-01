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