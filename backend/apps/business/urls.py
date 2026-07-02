from django.urls import path
from .views import AnalyticsDashboardView

urlpatterns = [
    path('kpis/', AnalyticsDashboardView.as_view(), name='analytics-kpis'),
]