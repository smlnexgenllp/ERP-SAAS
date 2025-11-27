from django.urls import path, include
from . import views

urlpatterns = [
    # Organization registration
    path('register/', views.OrganizationRegistrationView.as_view(), name='organization-register'),
    
    # Current organization
    path('current/', views.CurrentOrganizationView.as_view(), name='current-organization'),
    
    # Main organization dashboard routes
    path('main-org/dashboard/', views.MainOrganizationViewSet.as_view({'get': 'dashboard'}), name='main-org-dashboard'),
    path('main-org/sub-organizations/', views.MainOrganizationViewSet.as_view({'get': 'sub_organizations_list'}), name='main-org-sub-organizations'),
    path('main-org/available-modules/', views.MainOrganizationViewSet.as_view({'get': 'available_modules'}), name='available-modules'),
    path('main-org/sub-organizations/<str:sub_org_id>/', views.MainOrganizationViewSet.as_view({'get': 'sub_organization_detail'}), name='sub-org-detail'),
    path('main-org/sub-organizations/<str:sub_org_id>/module-access/', views.MainOrganizationViewSet.as_view({'post': 'update_module_access'}), name='update-module-access'),
]