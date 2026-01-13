# utils.py or middleware

def get_user_organization(request):
    if not request.user.is_authenticated:
        return None
    try:
        org_user = OrganizationUser.objects.get(user=request.user, is_active=True)
        return org_user.organization
    except OrganizationUser.DoesNotExist:
        return None


# Add to views or mixin
class OrganizationRequiredMixin:
    def dispatch(self, request, *args, **kwargs):
        request.user_current_organization = get_user_organization(request)
        if not request.user_current_organization:
            raise Http404("You are not assigned to any organization")
        return super().dispatch(request, *args, **kwargs)