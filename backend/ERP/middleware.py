from apps.organizations.models import OrganizationUser

class CurrentOrganizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user_current_organization = None

        if request.user.is_authenticated:
            ou = OrganizationUser.objects.filter(
                user=request.user,
                is_active=True
            ).select_related('organization').first()

            if ou:
                request.user_current_organization = ou.organization
                print(f"[OK] Attached org: {ou.organization.name} for {request.user.email}")

        return self.get_response(request)