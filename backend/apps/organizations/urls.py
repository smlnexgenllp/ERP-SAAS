from django.urls import path, include
from . import views
from .views import TrainingVideoDetailView, CreateSubOrgUserView, SubOrgLoginView, TrainingVideoUploadView, TrainingVideoListView, MarkVideoWatchedView

urlpatterns = [
    # Organization registration
    path('register/', views.OrganizationRegistrationView.as_view(), name='organization-register'),
    
    # Current organization
    path('current/', views.CurrentOrganizationView.as_view(), name='current-organization'),
    path("<int:org_id>/create-user/", CreateSubOrgUserView.as_view(), name="create_suborg_user"),
    
    # Sub-organization creation
    path('sub-organizations/create/', views.SubOrganizationCreationView.as_view(), name='create-sub-organization'),
    path("training-videos/upload/", TrainingVideoUploadView.as_view()),
    path("training-videos/", TrainingVideoListView.as_view()),
    path('training-videos/<int:pk>/', TrainingVideoDetailView.as_view()),
    # urls.py
    path('training-videos/<int:video_id>/watch/', MarkVideoWatchedView.as_view(), name='mark-video-watched'),
    # Main organization dashboard routes
    path('main-org/dashboard/', views.MainOrganizationViewSet.as_view({'get': 'dashboard'}), name='main-org-dashboard'),
    path('main-org/sub-organizations/', views.MainOrganizationViewSet.as_view({'get': 'sub_organizations_list'}), name='main-org-sub-organizations'),
    path('main-org/available-modules/', views.MainOrganizationViewSet.as_view({'get': 'available_modules'}), name='available-modules'),
    path('main-org/sub-organizations/<str:sub_org_id>/', views.MainOrganizationViewSet.as_view({'get': 'sub_organization_detail'}), name='sub-org-detail'),
    path('main-org/sub-organizations/<str:sub_org_id>/module-access/', views.MainOrganizationViewSet.as_view({'post': 'update_module_access'}), name='update-module-access'),
    path('main-org/sub-org-modules/', views.MainOrganizationViewSet.as_view({'get': 'sub_org_available_modules'}), name='sub-org-modules'),
    path('user-dashboard/', views.UserDashboardView.as_view(), name='user-dashboard'),
    path("suborg-login/", SubOrgLoginView.as_view(), name="suborg-login"),

    # Debug endpoint
    path('debug-modules/', views.debug_modules_data, name='debug-modules'),
]