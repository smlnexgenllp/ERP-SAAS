# from rest_framework.views import APIView
# from rest_framework.response import Response
# from .models import OrganizationUser

# class OrganizationTreeView(APIView):
#     def get(self, request):
#         org = request.user.orguser.organization
#         users = OrganizationUser.objects.filter(organization=org)

#         # Build tree
#         def build(user):
#             return {
#                 "name": user.user.username,
#                 "role": user.role,
#                 "children": [build(child) for child in user.subordinates.all()]
#             }

#         root = users.filter(manager__isnull=True)
#         tree = [build(u) for u in root]

#         return Response(tree)
