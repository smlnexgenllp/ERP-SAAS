class CurrentOrganizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user_current_organization = None

        if request.user.is_authenticated:
            # 🔥 adjust based on your model
            org_user = getattr(request.user, "organization_user", None)

            if org_user:
                request.user_current_organization = org_user.organization

        return self.get_response(request)