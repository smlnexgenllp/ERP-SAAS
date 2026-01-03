# apps/hr/views/org_tree_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.hr.models import Employee
from apps.hr.serializers import OrgTreeSerializer
from apps.organizations.models import Organization

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def org_tree_view(request):
    user = request.user

    # Robust organization resolution
    organization = None

    # Method 1: User has linked Employee
    if hasattr(user, 'employee'):
        organization = user.employee.organization

    # Method 2: Fallback to organization field on User model (common in multi-org setups)
    if not organization and hasattr(user, 'organization'):
        organization = user.organization

    # Method 3: Last resort - first org (for demo/superadmin)
    if not organization:
        organization = Organization.objects.first()

    if not organization:
        return Response({"tree": []})

    # Get only root employees (no reporting_to)
    roots = Employee.objects.filter(
        organization=organization,
        reporting_to=None,
        is_active=True
    ).select_related('designation', 'department', 'user').order_by('full_name')

    serializer = OrgTreeSerializer(roots, many=True, context={'request': request})
    return Response({"tree": serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def public_org_tree_view(request):
    organization = Organization.objects.first()
    if not organization:
        return Response({"tree": []})

    roots = Employee.objects.filter(
        organization=organization,
        reporting_to=None,
        is_active=True
    ).select_related('designation', 'department', 'user')

    # Build dummy request for full photo URLs
    from django.test import RequestFactory
    factory = RequestFactory()
    dummy_request = factory.get('/')
    dummy_request.META['SERVER_NAME'] = '127.0.0.1'
    dummy_request.META['SERVER_PORT'] = '8000'

    serializer = OrgTreeSerializer(roots, many=True, context={'request': dummy_request})
    return Response({"tree": serializer.data})