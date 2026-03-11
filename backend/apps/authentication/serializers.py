from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.hr.models import Employee

class EmployeeLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    def validate(self, data):
        email = data['email'].lower().strip()

        try:
            # Find employee by email (assuming emails are unique system-wide)
            employee = Employee.objects.select_related('user', 'organization').get(email=email)
        except Employee.DoesNotExist:
            raise serializers.ValidationError({
                "detail": "No account found with this email."
            })
        except Employee.MultipleObjectsReturned:
            # Very rare if you enforce uniqueness — but good to catch
            raise serializers.ValidationError({
                "detail": "Multiple accounts found. Contact support."
            })

        user = employee.user

        if not user:
            raise serializers.ValidationError({
                "detail": "This employee account has no linked user."
            })

        if not user.check_password(data['password']):
            raise serializers.ValidationError({
                "detail": "Incorrect password."
            })

        if not employee.is_active:
            raise serializers.ValidationError({
                "detail": "This account is inactive."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "detail": "User account is disabled."
            })

        data['employee'] = employee
        data['user']     = user
        return data