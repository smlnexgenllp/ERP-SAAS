# apps/stock/views.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.inventory.models import Item, StockLedger
from .serializers import ItemStockSerializer, StockLedgerSerializer


class StockItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API Endpoints:
    - GET /api/stock/items/                  → List all items with current stock (from approved GRNs)
    - GET /api/stock/items/<id>/              → Detail of one item
    - GET /api/stock/items/<id>/ledger/       → Full movement history for an item
    """
    serializer_class = ItemStockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return items belonging to the logged-in user's organization.
        Includes search, category filter, and low stock filter.
        """
        user = self.request.user

        # Safety: if user has no organization, return empty queryset
        if not hasattr(user, 'organization') or not user.organization:
            return Item.objects.none()

        qs = Item.objects.filter(organization=user.organization)

        # Search by name or code
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search)
            )

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        # Low stock filter (client-side because current_stock is a property)
        low_stock_only = self.request.query_params.get('low_stock', 'false').lower() == 'true'
        if low_stock_only:
            # Load into memory and filter based on computed current_stock
            items = list(qs)
            return [item for item in items if float(item.current_stock) <= 10.0]

        return qs.order_by('name')


    @action(detail=True, methods=['get'], url_path='ledger')
    def ledger(self, request, pk=None):
        """
        Return full stock movement history for a specific item
        """
        item = self.get_object()  # respects organization filter

        movements = item.stock_movements.select_related('created_by').order_by('-created_at')

        # Handle pagination if enabled
        page = self.paginate_queryset(movements)
        if page is not None:
            serializer = StockLedgerSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = StockLedgerSerializer(movements, many=True)
        return Response({
            'item': self.get_serializer(item).data,
            'current_stock': str(item.current_stock),      # ensure Decimal → str for JSON
            'available_stock': str(item.available_stock),
            'movements': serializer.data
        })


class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Full stock ledger (movements) across all items in the organization
    Supports filtering by item, transaction type, and date range
    """
    serializer_class = StockLedgerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, 'organization') or not user.organization:
            return StockLedger.objects.none()

        qs = StockLedger.objects.filter(
            item__organization=user.organization
        ).select_related('item', 'created_by')

        # Filter by specific item
        item_id = self.request.query_params.get('item')
        if item_id:
            qs = qs.filter(item_id=item_id)

        # Filter by transaction type
        trans_type = self.request.query_params.get('transaction_type')
        if trans_type in ['IN', 'OUT', 'ADJ']:
            qs = qs.filter(transaction_type=trans_type)

        # Date range filters
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs.order_by('-created_at')