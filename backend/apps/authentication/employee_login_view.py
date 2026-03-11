from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import login
from .serializers import EmployeeLoginSerializer
from apps.hr.serializers import EmployeeSerializer  # assuming you have this

class EmployeeLoginView(APIView):
    permission_classes = [AllowAny]          # ← allows unauthenticated access

    def post(self, request):
        serializer = EmployeeLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee = serializer.validated_data['employee']
        user     = serializer.validated_data['user']

        # Create Django session
        login(request, user)

        # Your custom flag
        employee.is_logged_in = True
        employee.save(update_fields=['is_logged_in'])

        return Response({
            "message": "Login successful",
            "employee": EmployeeSerializer(employee).data
        }, status=status.HTTP_200_OK)
        

from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import logout
from django.contrib.sessions.models import Session
from django.conf import settings
from apps.hr.models import Employee


class EmployeeLogoutView(APIView):
    """
    Logout specifically for employees (clears session + is_logged_in flag)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        employee = None
        try:
            employee = request.user.employee
            employee.is_logged_in = False
            employee.save(update_fields=["is_logged_in"])
        except (AttributeError, Employee.DoesNotExist):
            # User might not have employee profile → continue logout anyway
            pass

        # Clear Django session
        logout(request)

        # Extra safety: delete session from database
        if request.session.session_key:
            try:
                Session.objects.filter(session_key=request.session.session_key).delete()
            except:
                pass

        response = Response(
            {"message": "Employee logged out successfully"},
            status=status.HTTP_200_OK
        )

        # Force browser to delete session cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME or "sessionid",
            value="",
            expires=0,
            max_age=0,
            path=settings.SESSION_COOKIE_PATH or "/",
            domain=settings.SESSION_COOKIE_DOMAIN,
            secure=settings.SESSION_COOKIE_SECURE,
            httponly=settings.SESSION_COOKIE_HTTPONLY,
            samesite=settings.SESSION_COOKIE_SAMESITE,
        )

        return response