# apps/business/urls.py

from django.urls import path
from . import views

app_name = "business"

urlpatterns = [
    path(
        "dashboard/",
        views.business_dashboard,
        name="business-dashboard",
    ),
]