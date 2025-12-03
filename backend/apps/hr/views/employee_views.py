from rest_framework import viewsets, filters, status,permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.hr.models import Department, Designation, Employee,EmployeeDocument
from apps.hr.serializers import DepartmentSerializer, DesignationSerializer, EmployeeSerializer, EmployeeDocumentSerializer
from apps.hr.permissions import IsHRManagerOrAdmin

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsHRManagerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [IsHRManagerOrAdmin]
# apps/hr/views/employee_views.py or views.py


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department', 'designation', 'user').all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Regular users see only their own data
        if not self.request.user.is_staff:
            return self.queryset.filter(user=self.request.user)
        return self.queryset
    
    @action(detail=False, methods=['get'])
    def debug(self, request):
        return Response({
            "message": "EmployeeViewSet is working!",
            "user": request.user.username if request.user.is_authenticated else "No user",
            "has_me_method": hasattr(self, 'me'),
            "me_method": str(getattr(self, 'me', None))
        })

    @action(detail=False, methods=['get'], url_path='me',permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {"detail": "No employee profile found."},
                status=404
            )


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmployeeDocument.objects.all()  # ← THIS LINE WAS MISSING!

    def get_queryset(self):
        # Only show documents belonging to current user
        return EmployeeDocument.objects.filter(employee__user=self.request.user)

    def perform_create(self, serializer):
        try:
            employee = Employee.objects.get(user=self.request.user)
            serializer.save(employee=employee)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Employee profile not found")