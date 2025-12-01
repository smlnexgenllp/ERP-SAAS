from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/organizations/', include('apps.organizations.urls')),# Correct root URL
    #  path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path("api/hr/", include("apps.hr.urls")),

]

