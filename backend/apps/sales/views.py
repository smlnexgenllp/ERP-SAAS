from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import EmailMessage
from django.utils import timezone
from django.core.files.base import ContentFile
from io import BytesIO
from .models import GSTSettings
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# Assuming these serializers exist or will be created
from .serializers import ContactSerializer, QuotationSerializer, FollowUpSerializer

from apps.crm.models import Contact
from apps.sales.models import Quotation, FollowUp


class QualifiedLeadsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        leads = Contact.objects.filter(
            organization=request.user.organization,
            status="qualified"
        ).order_by("-created_at")

        serializer = ContactSerializer(leads, many=True)
        return Response(serializer.data)


class QualifiedLeadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            lead = Contact.objects.get(
                id=id,
                organization=request.user.organization
            )
        except Contact.DoesNotExist:
            return Response({"detail": "Lead not found or access denied"}, status=404)

        serializer = ContactSerializer(lead)
        return Response(serializer.data)


class CreateQuotationFromLeadView(APIView):
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lead_id = request.data.get("lead_id")
        if not lead_id:
            return Response({"detail": "lead_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lead = Contact.objects.get(id=lead_id, organization=request.user.organization)
        except Contact.DoesNotExist:
            return Response({"detail": "Lead not found or access denied"}, status=404)

        # Extract data
        customer_name    = request.data.get("customer_name", lead.full_name or "Valued Customer")
        customer_email   = request.data.get("customer_email", lead.email or "")
        customer_company = request.data.get("customer_company", lead.company or "")
        validity_date_str = request.data.get("validity_date", "")
        items            = request.data.get("items", [])
        notes            = request.data.get("notes", "")

        try:
            total = float(request.data.get("total", 0))
        except:
            total = 0

        if not customer_email:
            return Response({"detail": "No email address available"}, status=400)

        if not items or total <= 0:
            return Response({"detail": "Quotation must have items"}, status=400)

        # Company info
        org = request.user.organization
        company_name    = org.name if org else "Your Company Name"
        company_address = getattr(org, 'address', "Your Address")
        company_phone   = getattr(org, 'phone', "+91-0000000000")
        company_email   = getattr(org, 'email', "info@company.com")
        prepared_by     = request.user.get_full_name() or request.user.username

        today = timezone.now().strftime("%d-%m-%Y")
        quote_number = f"QTN-{timezone.now().strftime('%Y%m')}-{lead.id:04d}"
        # ✅ Get GST Settings
        gst_settings = GSTSettings.get_instance()

        gst_rate_value = float(gst_settings.gst_rate)  # Decimal → float
        gst_rate = gst_rate_value / 100
        gst_rate_display = int(gst_rate_value)

        gstin = gst_settings.gstin or "N/A"

        # Calculations
        gst_amount = total * gst_rate
        grand_total = total + gst_amount
        try:
            validity_date = timezone.datetime.strptime(validity_date_str, "%Y-%m-%d").date() if validity_date_str else None
        except:
            validity_date = None

        valid_until = validity_date.strftime("%d-%m-%Y") if validity_date else "30 days"

        # ───────── PDF GENERATION (NEW DESIGN) ─────────
        # ───────── PROFESSIONAL PDF DESIGN ─────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=40, leftMargin=40,
                                topMargin=40, bottomMargin=40)

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Right', alignment=2))
        styles.add(ParagraphStyle(name='TitleWhite', alignment=1, fontSize=16, textColor=colors.white))
        styles.add(ParagraphStyle(name='Bold', fontSize=11))
        styles.add(ParagraphStyle(name='Small', fontSize=9, textColor=colors.grey))

        elements = []

        # ─── HEADER BAR ───
        header = Table([[
            Paragraph(f"<b>{company_name}</b>", styles['Normal']),
            Paragraph("<b>QUOTATION</b>", styles['TitleWhite'])
        ]], colWidths=[300, 200])

        header.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1f4e79")),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.white),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('FONTSIZE', (0,0), (-1,-1), 14),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))

        elements.append(header)
        elements.append(Spacer(1, 15))

        # ─── COMPANY + QUOTE INFO ───
        info = Table([
            [
                Paragraph(f"{company_address}<br/>{company_phone}<br/>{company_email}", styles['Small']),
                Paragraph(
                    f"<b>Quotation No:</b> {quote_number}<br/>"
                    f"<b>Date:</b> {today}<br/>"
                    f"<b>Valid Until:</b> {valid_until}",
                    styles['Right']
                )
            ]
        ], colWidths=[300, 200])

        elements.append(info)
        elements.append(Spacer(1, 20))

        # ─── BILL TO ───
        elements.append(Paragraph("<b>Bill To:</b>", styles['Bold']))
        elements.append(Paragraph(
            f"{customer_name}<br/>{customer_company}<br/>{customer_email}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 15))

        # ─── ITEMS TABLE ───
        table_data = [["#", "Description", "Qty", "Unit Price", "Amount"]]

        for i, item in enumerate(items, start=1):
            qty = float(item.get("quantity", 1))
            price = float(item.get("unit_price", 0))
            amount = qty * price

            table_data.append([
                str(i),
                item.get("description", ""),
                f"{qty}",
                f"Rs {price:,.2f}",
                f"Rs {amount:,.2f}"
            ])

        item_table = Table(table_data, colWidths=[30, 220, 50, 90, 90])

        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1f4e79")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('ALIGN', (2,1), (-1,-1), 'CENTER'),
        ]))

        elements.append(item_table)
        elements.append(Spacer(1, 20))

        # ─── GST BOX ───
        gst_box = Table([
        ["GST Details"],
        [f"GST Rate: {gst_rate_display}%"],
        [f"GST Amount: Rs {gst_amount:,.2f}"],
        [f"GSTIN: {gstin}"]
    ])

        gst_box.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.grey),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
        ]))

        # ─── TOTALS ───
        totals = Table([
            ["Subtotal", f"Rs {total:,.2f}"],
            [f"GST ({gst_rate_display}%)", f"Rs {gst_amount:,.2f}"],
            ["Grand Total", f"Rs {grand_total:,.2f}"]
        ], colWidths=[120, 120])

        totals.setStyle(TableStyle([
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
            ('BACKGROUND', (0,2), (-1,2), colors.HexColor("#2e7d32")),
            ('TEXTCOLOR', (0,2), (-1,2), colors.white),
            ('FONTNAME', (0,2), (-1,2), 'Helvetica-Bold'),
        ]))

        final_table = Table([[gst_box, totals]], colWidths=[260, 200])
        elements.append(final_table)

        elements.append(Spacer(1, 25))

        # ─── TERMS ───
        elements.append(Paragraph("<b>Terms & Conditions</b>", styles['Bold']))
        elements.append(Paragraph(
            "• Payment within 15 days<br/>"
            "• Delivery within 7 days<br/>"
            "• GST as applicable",
            styles['Normal']
        ))
        elements.append(Spacer(1, 40))
        # ─── SIGNATURE ───
        elements.append(Paragraph(f"For {company_name}", styles['Right']))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Authorized Signature", styles['Right']))
        doc.build(elements)
        pdf_content = buffer.getvalue()
        buffer.close()
        # ───────── END PDF ─────────
        email = EmailMessage(
            subject=f"Quotation {quote_number}",
            body=f"Dear {customer_name}, please find attached quotation.",
            from_email=company_email,
            to=[customer_email],
        )
        email.attach(f"Quotation_{quote_number}.pdf", pdf_content, "application/pdf")
        email.send()
        quotation = Quotation.objects.create(
            lead=lead,
            quote_number=quote_number,
            status='sent',
            customer_name=customer_name,
            customer_email=customer_email,
            customer_company=customer_company,
            validity_date=validity_date,
            total=total,
            gst_amount=gst_amount,
            grand_total=grand_total,
            notes=notes,
            created_by=request.user,
            pdf_file=ContentFile(pdf_content, f"Quotation_{quote_number}.pdf")
        )

        return Response({
            "detail": "Quotation created and sent",
            "quotation_id": quotation.id
        }, status=201)


class QuotationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quotations = Quotation.objects.filter(
            lead__organization=request.user.organization
        ).select_related('lead', 'created_by').order_by('-created_at')
        serializer = QuotationSerializer(quotations, many=True)
        return Response(serializer.data)
class QuotationDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        try:
            quotation = Quotation.objects.get(
                pk=pk,
                lead__organization=request.user.organization
            )
        except Quotation.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        serializer = QuotationSerializer(quotation)
        return Response(serializer.data)

class QuotationStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            quotation = Quotation.objects.get(
                pk=pk,
                lead__organization=request.user.organization
            )
        except Quotation.DoesNotExist:
            return Response({"detail": "Quotation not found"}, status=404)

        new_status = request.data.get("status")
        comment = request.data.get("comment", "")

        allowed_transitions = {
            'sent': ['in_negotiation', 'approved', 'rejected'],
            'in_negotiation': ['approved', 'rejected'],
        }

        if quotation.status not in allowed_transitions or new_status not in allowed_transitions.get(quotation.status, []):
            return Response({"detail": f"Cannot change status from {quotation.status} to {new_status}"}, status=400)

        quotation.status = new_status
        if new_status == 'approved':
            quotation.approved_at = timezone.now()
            quotation.approved_by = request.user

        if comment:
            quotation.notes = (quotation.notes or "") + f"\n[{timezone.now().strftime('%Y-%m-%d')}] {request.user}: {comment}"

        quotation.save()

        return Response({
            "detail": f"Status updated to {new_status}",
            "status": quotation.status
        })


class FollowUpListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quotation_id):
        try:
            Quotation.objects.get(id=quotation_id, lead__organization=request.user.organization)
        except Quotation.DoesNotExist:
            return Response({"detail": "Quotation not found"}, status=404)

        followups = FollowUp.objects.filter(quotation_id=quotation_id).order_by('-scheduled_at')
        serializer = FollowUpSerializer(followups, many=True)
        return Response(serializer.data)

    def post(self, request, quotation_id):
        try:
            quotation = Quotation.objects.get(id=quotation_id, lead__organization=request.user.organization)
        except Quotation.DoesNotExist:
            return Response({"detail": "Quotation not found"}, status=404)

        serializer = FollowUpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                quotation=quotation,
                created_by=request.user
            )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
# apps/sales/views.py → ConvertToCustomerView

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from apps.crm.models import Customer, Contact
from .models import Quotation
from decimal import Decimal


class ConvertToCustomerView(APIView):
    """
    POST /api/sale/quotations/<pk>/convert-to-customer/
    Creates a Customer from an approved Quotation's linked Lead/Contact
    Accepts extra form fields (PAN, GSTIN, etc.)
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            # Fetch quotation with lead preloaded
            quotation = Quotation.objects.select_related('lead').get(
                pk=pk,
                lead__organization=request.user.organization
            )
        except Quotation.DoesNotExist:
            return Response(
                {"detail": "Quotation not found or access denied"},
                status=status.HTTP_404_NOT_FOUND
            )

        if quotation.status != 'approved':
            return Response(
                {"detail": "Only approved quotations can be converted to customers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # The linked Contact (lead)
        contact = quotation.lead

        # Prevent duplicate by email
        if Customer.objects.filter(
            email=contact.email,
            organization=request.user.organization
        ).exists():
            return Response(
                {"detail": "A customer with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get extra fields from the form submission
        data = request.data

        # Create Customer with all available data
        customer = Customer.objects.create(
            organization=request.user.organization,
            contact=contact,  # OneToOne link
            full_name=contact.full_name or quotation.customer_name or data.get('full_name', "Unnamed Customer"),
            email=contact.email or quotation.customer_email or data.get('email', ""),
            phone=contact.phone or contact.mobile or data.get('phone', ""),
            company=contact.company or quotation.customer_company or data.get('company', ""),

            # Extra fields from your form (safe .get() – won't crash if missing)
            pan_number=data.get('pan_number', ''),
            gstin=data.get('gstin', ''),
            aadhaar_number=data.get('aadhaar_number', ''),
            business_type=data.get('business_type', ''),
            industry=data.get('industry', ''),
            alternate_phone=data.get('alternate_phone', ''),
            billing_address=data.get('billing_address', ''),
            shipping_address=data.get('shipping_address', ''),
            payment_terms_days=int(data.get('payment_terms_days', 30)),
            credit_limit=Decimal(str(data.get('credit_limit', '0'))),
            notes=data.get('notes', ''),

            created_by=request.user,
        )

        # Mark original contact as customer
        contact.status = 'customer'
        contact.save(update_fields=['status'])

        return Response({
            "detail": "Successfully converted to customer",
            "customer_id": customer.id,
            "customer_full_name": customer.full_name,
            "customer_email": customer.email,
        }, status=status.HTTP_201_CREATED)       
from .serializers import CustomerSerializer  # create this

class CustomerListView(APIView):
    def get(self, request):
        customers = Customer.objects.filter(
            organization=request.user.organization
        ).order_by('-customer_since')
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)
# apps/sales/views.py (add this class)

class CustomerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            customer = Customer.objects.get(
                id=pk,
                organization=request.user.organization
            )
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found or access denied"}, status=404)

        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
# apps/sales/views.py (add this class)
class CustomerUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            customer = Customer.objects.get(
                id=pk,
                organization=request.user.organization
            )
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found or access denied"}, status=404)

        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import SalesOrder
from .serializers import SalesOrderSerializer
from apps.crm.models import Customer

# apps/sales/views.py → SalesOrderCreateView (updated)

# apps/sales/views.py → SalesOrderCreateView (fixed version)

class SalesOrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer_id = request.data.get('customer')
        if not customer_id:
            return Response({"detail": "customer ID is required"}, status=400)

        try:
            customer = Customer.objects.get(id=customer_id, organization=request.user.organization)
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found or access denied"}, status=404)

        data = request.data.copy()
        data['customer'] = customer.id

        # FIXED: Always pass context with request
        serializer = SalesOrderSerializer(data=data, context={'request': request})

        if serializer.is_valid():
            order = serializer.save()
            return Response(SalesOrderSerializer(order).data, status=201)
        return Response(serializer.errors, status=400)
# apps/sales/views.py
class SalesOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = SalesOrder.objects.filter(
            organization=request.user.organization
        ).select_related('customer').order_by('-order_date')
        serializer = SalesOrderSerializer(orders, many=True)
        return Response(serializer.data)
class SalesOrderUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = SalesOrder.objects.get(
                id=pk,
                organization=request.user.organization
            )
        except SalesOrder.DoesNotExist:
            return Response({"detail": "Order not found or access denied"}, status=404)

        serializer = SalesOrderSerializer(order, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
class SalesOrderDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            order = SalesOrder.objects.get(id=pk, organization=request.user.organization)
        except SalesOrder.DoesNotExist:
            return Response({"detail": "Not found or access denied"}, status=404)

        # Optional: prevent deletion of processed orders
        if order.status in ['shipped', 'delivered']:
            return Response({"detail": "Cannot delete shipped/delivered orders"}, status=400)

        order.delete()
        return Response(status=204)
class SalesOrderStatusUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        try:
            order = SalesOrder.objects.get(
                id=pk,
                organization=request.user.organization
            )
        except SalesOrder.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)

        new_status = request.data.get("status")

        allowed = {

            "draft": [
                "approved",
                "rejected",
                "cancelled"
            ],

            "approved": [
                "processing"
            ],

            "processing": [
                "shipped"
            ],

            "shipped": [
                "delivered"
            ]
        }

        if order.status not in allowed or new_status not in allowed.get(order.status, []):
            return Response({
                "detail": f"Cannot change from {order.status} to {new_status}"
            }, status=400)

        order.status = new_status

        if new_status == "approved":
            order.approved_at = timezone.now()
            order.approved_by = request.user

        order.save()

        return Response({
            "detail": "Status updated",
            "status": order.status
        })
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import GSTSettings
from .serializers import GSTSettingsSerializer

class GSTSettingsAPIView(APIView):
    def get(self, request):
        settings = GSTSettings.get_instance()
        serializer = GSTSettingsSerializer(settings)
        return Response(serializer.data)

    def post(self, request):
        settings = GSTSettings.get_instance()
        serializer = GSTSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
