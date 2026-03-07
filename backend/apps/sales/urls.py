from django.urls import path
from .views import (
    QualifiedLeadsListView,
    QualifiedLeadDetailView,
)

urlpatterns = [
    path('qualified-leads/', QualifiedLeadsListView.as_view(), name='qualified-leads-list'),
    path('leads/<int:id>/', QualifiedLeadDetailView.as_view(), name='lead-detail'),
]