from django.urls import path, include
# from .views.invitation_views import SendInvitationView, AcceptInvitationView
# from .views.manager_views import HRUsersView, HRDocumentList
# from .views.employee_views import UploadMyDocument
# from .views.org_tree_views import OrganizationTreeView

from rest_framework import routers
from .views import (
DepartmentViewSet, DesignationViewSet, EmployeeViewSet
)

router = routers.DefaultRouter()
router.register('departments', DepartmentViewSet)
router.register('designations', DesignationViewSet)
router.register('employees', EmployeeViewSet)



urlpatterns = [
    # path("invite/", SendInvitationView.as_view()),
    # path("invite/accept/<uuid:token>/", AcceptInvitationView.as_view()),
    # path("users/", HRUsersView.as_view()),
    # path("documents/", HRDocumentList.as_view()),
    # path("employee/upload/", UploadMyDocument.as_view()),
    # path("org-tree/", OrganizationTreeView.as_view()),
    path('', include(router.urls)),
]
