from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.organizations.models import Organization
from apps.hr.models import Employee

class EmployeeLoginSerializer(serializers.Serializer):
    sub_organization = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        sub_org = data["sub_organization"]
        email = data["email"]
        password = data["password"]

        # 1. Check sub-organization
        try:
            organization = Organization.objects.get(subdomain=sub_org)
        except Organization.DoesNotExist:
            raise serializers.ValidationError({"message": "Invalid Sub Organization"})

        # 2. Check employee exists in this organization
        try:
            employee = Employee.objects.get(email=email, organization=organization)
        except Employee.DoesNotExist:
            raise serializers.ValidationError({"message": "Employee Not Found in this Organization"})

        # 3. Validate password
        if not employee.user.check_password(password):
            raise serializers.ValidationError({"message": "Invalid Password"})

        data["employee"] = employee
        return data
