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

    # METHOD THAT ALWAYS WORKS (even for admins with no Employee profile)
    try:
        # Try from linked Employee first
        org = user.employee.organization
    except:
        # FALLBACK: Get organization from your auth payload (you already have it!)
        # Your logs show: organization: {id: 1, name: 'SMLNEXGENLLP'}
        org_id = user.organization_id if hasattr(user, 'organization_id') else None
        
        if org_id:
            org = Organization.objects.get(id=org_id)
        else:
            # Last resort
            org = Organization.objects.first()

    if not org:
        return Response({"tree": []}, status=400)

    # Get ALL root employees (no boss) in this organization
    roots = Employee.objects.filter(
        organization=org,
        reporting_to=None,      # This is the key!
        is_active=True
    ).select_related('designation', 'department')

    serializer = OrgTreeSerializer(roots, many=True, context={'request': request})
    return Response({"tree": serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def public_org_tree_view(request):
    org = Organization.objects.first()
    if not org:
        return Response({"tree": []})

    roots = Employee.objects.filter(
        organization=org,
        reporting_to=None,
        is_active=True
    ).select_related('designation', 'department')

    # Create dummy request for photo URLs
    from django.http import HttpRequest
    dummy = HttpRequest()
    dummy.META['SERVER_NAME'] = 'localhost'
    dummy.META['SERVER_PORT'] = '8000'

    serializer = OrgTreeSerializer(roots, many=True, context={'request': dummy})
    return Response({"tree": serializer.data})