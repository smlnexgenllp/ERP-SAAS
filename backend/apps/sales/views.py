from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import EmailMessage
from django.utils import timezone
from django.core.files.base import ContentFile
from io import BytesIO
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

        # Extract data with fallbacks
        customer_name    = request.data.get("customer_name", lead.full_name or "Valued Customer")
        customer_email   = request.data.get("customer_email", lead.email or "")
        customer_company = request.data.get("customer_company", lead.company or "")
        validity_date_str = request.data.get("validity_date", "")
        items            = request.data.get("items", [])
        notes            = request.data.get("notes", "")

        try:
            total = float(request.data.get("total", 0))
        except (TypeError, ValueError):
            total = 0

        if not customer_email:
            return Response({"detail": "No email address available"}, status=400)

        if not items or total <= 0:
            return Response({"detail": "Quotation must have items and positive total"}, status=400)

        # Company info
        org = request.user.organization
        company_name    = org.name if org else "Your Company"
        company_address = getattr(org, 'address', "Your Address")
        company_phone   = getattr(org, 'phone', "+91-000-000-0000")
        company_email   = getattr(org, 'email', "sales@yourcompany.com")
        prepared_by     = request.user.get_full_name() or request.user.username

        # Quotation identifiers
        today = timezone.now().strftime("%d-%m-%Y")
        quote_number = f"QTN-{timezone.now().strftime('%Y%m')}-{lead.id:04d}"

        # GST (make configurable later)
        gst_rate = 0.18
        gst_amount = total * gst_rate
        grand_total = total + gst_amount

        # Parse validity date (fallback: 30 days)
        try:
            validity_date = timezone.datetime.strptime(validity_date_str, "%Y-%m-%d").date() if validity_date_str else None
        except ValueError:
            validity_date = None

        valid_until = validity_date.strftime("%d-%m-%Y") if validity_date else "30 days from today"

        # ─── PDF Generation ───────────────────────────────────────────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=inch, leftMargin=inch,
                                topMargin=inch, bottomMargin=inch)

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='GreenTitle', textColor=colors.green, fontSize=12, leading=14, spaceAfter=8))
        styles.add(ParagraphStyle(name='YellowTotal', textColor=colors.black, backColor=colors.yellow,
                                  fontSize=12, alignment=1, spaceAfter=6))
        styles.add(ParagraphStyle(name='BoldRight', alignment=2, fontSize=11, leading=13))

        elements = []

        # Header
        header_data = [[
            Paragraph(f"<b>{company_name}</b><br/>{company_address}<br/>Phone: {company_phone}<br/>Email: {company_email}", styles['Normal']),
            Paragraph(
                f"<font size=14><b>QUOTE</b></font><br/><br/>"
                f"DATE: {today}<br/>"
                f"QUOTE #: {quote_number}<br/>"
                f"VALID UNTIL: {valid_until}<br/>"
                f"PREPARED BY: {prepared_by}",
                styles['BoldRight']
            )
        ]]
        header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.4*inch))

        # Customer
        elements.append(Paragraph("CUSTOMER", styles['GreenTitle']))
        elements.append(Paragraph(
            f"<b>{customer_name}</b><br/>{customer_company}<br/>{customer_email}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 0.3*inch))

        # Items
        table_data = [["DESCRIPTION", "TAXED", "AMOUNT"]]
        for item in items:
            qty = float(item.get('quantity', 1))
            price = float(item.get('unit_price', 0))
            line_total = qty * price
            table_data.append([
                item.get('description', '—'),
                "Yes",
                f"₹{line_total:,.2f}"
            ])

        items_table = Table(table_data, colWidths=[4.2*inch, 1*inch, 1.8*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.green),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,-1), 'CENTER'),
            ('ALIGN', (2,0), (2,-1), 'RIGHT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('FONTSIZE', (0,0), (-1,0), 11),
            ('FONTSIZE', (0,1), (-1,-1), 10),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.3*inch))

        # Totals
        totals_data = [
            ["Subtotal:", f"₹{total:,.2f}"],
            ["GST (18%):", f"₹{gst_amount:,.2f}"],
            ["Grand Total:", f"₹{grand_total:,.2f}"],
        ]
        totals_table = Table(totals_data, colWidths=[4*inch, 2*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,-1), 'RIGHT'),
            ('ALIGN', (1,0), (1,-1), 'RIGHT'),
            ('FONTNAME', (0,-1), (1,-1), 'Helvetica-Bold'),
            ('BACKGROUND', (1,-1), (1,-1), colors.yellow),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 0.4*inch))

        # Terms
        elements.append(Paragraph("TERMS AND CONDITIONS", styles['Heading2']))
        terms_text = (
            "1. This quotation is valid until the date mentioned above.<br/>"
            "2. Prices are exclusive of taxes unless stated otherwise.<br/>"
            f"3. {notes or 'No additional notes provided.'}"
        )
        elements.append(Paragraph(terms_text, styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))

        # Signature
        elements.append(Paragraph("Acceptance:", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("_______________________________", styles['Normal']))
        elements.append(Paragraph("Customer Signature & Date", styles['Normal']))

        doc.build(elements)
        pdf_content = buffer.getvalue()
        buffer.close()

        # Send email
        subject = f"Quotation {quote_number} - {customer_name}"
        body = (
            f"Dear {customer_name},\n\n"
            f"Please find your quotation attached ({quote_number}).\n"
            f"Valid until: {valid_until}\n\n"
            "Feel free to reach out with any questions.\n\n"
            f"Best regards,\n{prepared_by}\n{company_name}"
        )

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=company_email,
            to=[customer_email],
        )
        email.attach(f"Quotation_{quote_number}.pdf", pdf_content, "application/pdf")

        try:
            email.send(fail_silently=False)
        except Exception as e:
            return Response(
                {"detail": f"PDF generated but email failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Save quotation
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
            "quotation_id": quotation.id,
            "quote_number": quote_number
        }, status=status.HTTP_201_CREATED)


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