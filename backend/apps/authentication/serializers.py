from rest_framework import serializers
from apps.hr.models import Employee

class EmployeeLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):

        email = data["email"]
        password = data["password"]

        try:
            employee = Employee.objects.select_related("organization","user").get(
                email=email,
                is_active=True
            )
        except Employee.DoesNotExist:
            raise serializers.ValidationError({"message": "Employee not found"})

        if not employee.user:
            raise serializers.ValidationError({"message": "User account not linked"})

        if not employee.user.check_password(password):
            raise serializers.ValidationError({"message": "Invalid password"})

        data["employee"] = employee
        data["organization"] = employee.organization

        return data