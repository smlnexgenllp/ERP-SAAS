from django.urls import path
from .views.invitation_views import SendInvitationView, AcceptInvitationView
from .views.manager_views import HRUsersView, HRDocumentList
from .views.employee_views import UploadMyDocument
from .views.org_tree_views import OrganizationTreeView

urlpatterns = [
    path("invite/", SendInvitationView.as_view()),
    path("invite/accept/<uuid:token>/", AcceptInvitationView.as_view()),
    path("users/", HRUsersView.as_view()),
    path("documents/", HRDocumentList.as_view()),
    path("employee/upload/", UploadMyDocument.as_view()),
    path("org-tree/", OrganizationTreeView.as_view()),
]
