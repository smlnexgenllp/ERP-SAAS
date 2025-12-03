# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import authenticate
# from apps.organizations.models import Organization, OrganizationUser
# from apps.hr.models import Employee

# class CustomEmployeeLoginView(APIView):
#     def post(self, request):
#         print("LOGIN DEBUG:", request.data) 
#         sub_org = request.data.get("sub_organization")
#         email = request.data.get("email")
#         password = request.data.get("password")

#         if not sub_org or not email or not password:
#             return Response(
#                 {"detail": "sub_organization, email, password are required."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 1. Find organization
#         try:
#             org = Organization.objects.get(name__iexact=sub_org)
#         except Organization.DoesNotExist:
#             return Response({"detail": "Invalid Organization"}, status=400)

#         # 2. Check if user exists inside organization
#         try:
#             org_user = OrganizationUser.objects.get(
#                 organization=org, 
#                 user__email=email
#             )
#             user = org_user.user
#         except OrganizationUser.DoesNotExist:
#             return Response({"detail": "User not found in this Organization"}, status=400)

#         # 3. Verify password
#         user_auth = authenticate(username=user.username, password=password)
#         if not user_auth:
#             return Response({"detail": "Invalid Password"}, status=400)

#         # 4. Get employee profile
#         try:
#             employee = Employee.objects.get(user=user)
#             employee_data = {
#                 "id": employee.id,
#                 "employee_code": employee.employee_code,
#                 "first_name": employee.first_name,
#                 "last_name": employee.last_name,
#                 "email": employee.email,
#                 "department": employee.department.name if employee.department else None,
#                 "designation": employee.designation.name if employee.designation else None,
#             }
#         except Employee.DoesNotExist:
#             employee_data = None

#         return Response({
#             "message": "Login Successful",
#             "organization": org.name,
#             "user": user.username,
#             "employee_profile": employee_data
#         })
