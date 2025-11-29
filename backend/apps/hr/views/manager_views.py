from rest_framework.views import APIView
from hr.permissions import IsHRManager

class HRUsersView(APIView):
    permission_classes = [IsHRManager]

    def get(self, request):
        org = request.user.orguser.organization
        users = OrganizationUser.objects.filter(organization=org)
        serializer = OrganizationUserSerializer(users, many=True)
        return Response(serializer.data)
class HRDocumentList(APIView):
    permission_classes = [IsHRManager]

    def get(self, request):
        org = request.user.orguser.organization
        docs = EmployeeDocument.objects.filter(user__organization=org)
        serializer = EmployeeDocumentSerializer(docs, many=True)
        return Response(serializer.data)
