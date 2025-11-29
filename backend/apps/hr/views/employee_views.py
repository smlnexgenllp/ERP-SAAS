from rest_framework.views import APIView
from hr.permissions import IsEmployee

class UploadMyDocument(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        user = request.user.orguser

        file = request.FILES["file"]
        doc_type = request.data.get("doc_type")

        EmployeeDocument.objects.create(
            user=user,
            file=file,
            doc_type=doc_type
        )

        return Response({"message": "Uploaded"})
def build_tree(user):
    return {
        "name": user.user.username,
        "role": user.role,
        "children": [build_tree(sub) for sub in user.subordinates.all()]
    }


class OrgTreeView(APIView):
    def get(self, request):
        org = request.user.orguser.organization
        root = OrganizationUser.objects.filter(organization=org, manager=None).first()
        return Response(build_tree(root))
