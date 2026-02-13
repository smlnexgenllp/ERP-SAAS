# apps/finance/views/vendor.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.http import Http404
from apps.finance.models.vendor import Vendor
from apps.finance.serializers.vendor import VendorSerializer 
from rest_framework.decorators import action
from rest_framework.response import Response




# ── DRF API ViewSet (this handles GET/POST/PUT/DELETE for React) ────────
class VendorViewSet(viewsets.ModelViewSet):
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            return Vendor.objects.none()
        return Vendor.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            raise PermissionDenied("No organization assigned")
        serializer.save(organization=org, created_by=self.request.user)

    def perform_update(self, serializer):
        org = getattr(self.request, 'user_current_organization', None)
        if not org or serializer.instance.organization != org:
            raise PermissionDenied("Cannot update vendor from different organization")
        serializer.save()
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        org = getattr(request, 'user_current_organization', None)
        
        if not org:
            return Response(
                {"error": "No organization context available"},
                status=400
            )

        qs = Vendor.objects.filter(organization=org)

        data = {
            "total": qs.count(),
            "active": qs.filter(is_active=True).count() if hasattr(Vendor, 'is_active') else 0,
            "approved": qs.filter(is_approved=True).count() if hasattr(Vendor, 'is_approved') else 0,
        }
        return Response(data)
class VendorListView(LoginRequiredMixin, ListView):
    model = Vendor
    template_name = 'finance/vendor_list.html'  # ← updated path
    context_object_name = 'vendors'
    paginate_by = 20

    def get_queryset(self):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            raise Http404("No organization found")
        return Vendor.objects.filter(organization=org)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['organization'] = getattr(self.request, 'user_current_organization', None)
        return context


class VendorCreateView(LoginRequiredMixin, CreateView):
    model = Vendor
    fields = [
        'name', 'email', 'phone', 'mobile', 'website', 'address',
        'gst_number', 'pan_number', 'msme_number', 'vendor_type',
        'payment_terms_days', 'is_active', 'is_approved'
    ]
    template_name = 'finance/vendor_form.html'  # ← updated
    success_url = reverse_lazy('finance:vendor_list')  # ← use app_name if set

    def form_valid(self, form):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            raise Http404("No organization assigned")
        form.instance.organization = org
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class VendorUpdateView(LoginRequiredMixin, UpdateView):
    model = Vendor
    fields = '__all__'
    template_name = 'finance/vendor_form.html'
    success_url = reverse_lazy('finance:vendor_list')

    def get_queryset(self):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            raise Http404("No organization found")
        return Vendor.objects.filter(organization=org)


class VendorDeleteView(LoginRequiredMixin, DeleteView):
    model = Vendor
    success_url = reverse_lazy('finance:vendor_list')
    template_name = 'finance/vendor_confirm_delete.html'

    def get_queryset(self):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            raise Http404("No organization found")
        return Vendor.objects.filter(organization=org)