from django.urls import path
from .views import (
    CreateQuotationFromLeadView,
    QualifiedLeadsListView,
    QualifiedLeadDetailView,
)

urlpatterns = [
    path('qualified-leads/', QualifiedLeadsListView.as_view(), name='qualified-leads-list'),
    path('qualified-leads/<int:id>/', QualifiedLeadDetailView.as_view(), name='lead-detail'),
    path('quotations/create-from-lead/', CreateQuotationFromLeadView.as_view(), name='create-quotation-from-lead'),
]