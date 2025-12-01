from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.hr.models import Department, Designation, Employee
from apps.hr.serializers import DepartmentSerializer, DesignationSerializer, EmployeeSerializer
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
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department', 'designation').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHRManagerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'employee_code', 'email']
    def get_queryset(self):
        qs = super().get_queryset()
# Restrict to  if user has  attached
        org_user = getattr(self.request.user, 'user', None)
        if org_user:
            qs = qs.filter(org_user)
        return qs
    def perform_create(self, serializer):
        org_user = getattr(self.request.user, 'user', None)
        if org_user:
            serializer.save(org_user)
        else:
            serializer.save()
#     @action(detail=True, methods=['post'])
#     def upload_document(self, request, pk=None):
#         employee = self.get_object()
#         serializer = EmployeeDocumentSerializer(data=request.data)
#         if serializer.is_valid():
# serializer.save(employee=employee)
# return Response(serializer.data, status=status.HTTP_201_CREATED)
# return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)