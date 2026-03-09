from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from .serializers import EmployeeLoginSerializer
from apps.hr.serializers import EmployeeSerializer  # return full profile
from rest_framework.permissions import AllowAny
class EmployeeLoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = EmployeeLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        employee = serializer.validated_data["employee"]
        organization = serializer.validated_data["organization"]

        login(request, employee.user)

        employee.is_logged_in = True
        employee.save(update_fields=["is_logged_in"])

        return Response({
            "message": "Login Success",
            "organization_id": organization.id,
            "organization_name": organization.name,
            "employee": EmployeeSerializer(employee).data
        })
        
from django.contrib.auth import logout

class EmployeeLogoutView(APIView):
    def post(self, request):
        employee = request.user.employee

        employee.is_logged_in = False
        employee.save(update_fields=["is_logged_in"])

        logout(request)

        return Response({"message": "Logged out successfully"})

