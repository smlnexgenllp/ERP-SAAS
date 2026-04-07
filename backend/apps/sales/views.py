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

        # Extract data from frontend
        customer_name = request.data.get("customer_name", lead.full_name or "Valued Customer")
        customer_email = request.data.get("customer_email", lead.email or "")
        customer_company = request.data.get("customer_company", lead.company or "")
        customer_phone = request.data.get("customer_phone", lead.phone or "")
        
        validity_date_str = request.data.get("validity_date", "")
        items = request.data.get("items", [])
        notes = request.data.get("notes", "")
        subtotal = float(request.data.get("total", 0))
        gst_percentage = float(request.data.get("gst_percentage", 18))

        if not customer_email:
            return Response({"detail": "Customer email is required"}, status=400)

        if not items or subtotal <= 0:
            return Response({"detail": "Quotation must have at least one item"}, status=400)

        # Organization & GST Details
        org = request.user.organization
        company_name = org.name if org else "Your Company Name"
        company_address = getattr(org, 'address', "123 Business Street, City, State 123456")
        company_phone = getattr(org, 'phone', "+91 98765 43210")
        company_email = getattr(org, 'email', "info@companyemail.com")

        gst_settings = GSTSettings.get_instance()
        gst_rate = float(gst_settings.gst_rate)
        gstin = gst_settings.gstin or "33XXXXX1234X"

        # Calculations
        gst_amount = (subtotal * gst_rate) / 100
        grand_total = subtotal + gst_amount

        # Dates
        today = timezone.now().strftime("%d-%m-%Y")
        quote_number = f"QTN-{timezone.now().strftime('%Y%m')}-{lead.id:04d}"

        try:
            validity_date = timezone.datetime.strptime(validity_date_str, "%Y-%m-%d").date()
            valid_until = validity_date.strftime("%d-%m-%Y")
        except:
            valid_until = (timezone.now() + timezone.timedelta(days=30)).strftime("%d-%m-%Y")

        # ==================== PDF GENERATION ====================
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=30,
            bottomMargin=30
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='HeaderTitle', fontSize=20, textColor=colors.white, alignment=1, fontName='Helvetica-Bold'))
        styles.add(ParagraphStyle(name='RightAlign', alignment=2, fontName='Helvetica'))
        styles.add(ParagraphStyle(name='Bold', fontSize=11, fontName='Helvetica-Bold'))
        styles.add(ParagraphStyle(name='Small', fontSize=9.5, textColor=colors.grey))

        elements = []

        # ===================== BLUE HEADER =====================
        # Replace this path with your actual logo path (recommended: static or media folder)
        logo_path = "path/to/your/company/logo.png"   # ← CHANGE THIS

        try:
            logo = Image(logo_path, width=55, height=55)
        except:
            logo = Paragraph(" ", styles['Normal'])  # fallback

        header_data = [[
            logo,
            Paragraph(f"<b>{company_name}</b>", styles['Normal']),
            Paragraph("QUOTATION", styles['HeaderTitle'])
        ]]

        header_table = Table(header_data, colWidths=[70, 250, 180])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1e3a8a')),  # Professional blue
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'LEFT'),
            ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
        ]))

        elements.append(header_table)
        elements.append(Spacer(1, 20))

        # ===================== COMPANY & QUOTE INFO =====================
        left_info = Paragraph(
            f"{company_address}<br/>{company_phone}<br/>{company_email}",
            styles['Small']
        )

        right_info = Paragraph(
            f"<b>Quotation No:</b> {quote_number}<br/>"
            f"<b>Date:</b> {today}<br/>"
            f"<b>Valid Until:</b> {valid_until}",
            styles['RightAlign']
        )

        info_table = Table([[left_info, right_info]], colWidths=[320, 180])
        elements.append(info_table)
        elements.append(Spacer(1, 25))

        # ===================== BILL TO =====================
        elements.append(Paragraph("<b>Bill To:</b>", styles['Bold']))
        bill_to = f"{customer_name}<br/>{customer_company}<br/>{customer_email}"
        if customer_phone:
            bill_to += f"<br/>{customer_phone}"
        elements.append(Paragraph(bill_to, styles['Normal']))
        elements.append(Spacer(1, 20))

        # ===================== ITEMS TABLE =====================
        table_data = [["#", "Description", "Qty", "Unit Price", "Amount"]]

        for i, item in enumerate(items, start=1):
            qty = float(item.get("quantity", 1))
            unit_price = float(item.get("unit_price", 0))
            amount = qty * unit_price

            table_data.append([
                str(i),
                item.get("description", ""),
                f"{int(qty)}",
                f"Rs {unit_price:,.2f}",
                f"Rs {amount:,.2f}"
            ])

        item_table = Table(table_data, colWidths=[35, 240, 50, 85, 90])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 1), (4, -1), 'CENTER'),
            ('ALIGN', (3, 1), (4, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
        ]))

        elements.append(item_table)
        elements.append(Spacer(1, 20))

        # ===================== GST DETAILS + TOTALS =====================
        gst_box = Table([
            ["GST Details"],
            [f"GST Rate: {int(gst_rate)}%"],
            [f"GST Amount: Rs {gst_amount:,.2f}"],
            [f"GSTIN: {gstin}"]
        ], colWidths=[200])

        gst_box.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))

        totals_data = [
            ["Subtotal:", f"Rs {subtotal:,.2f}"],
            [f"GST ({int(gst_rate)}%):", f"Rs {gst_amount:,.2f}"],
            ["Grand Total:", f"Rs {grand_total:,.2f}"]
        ]

        totals_table = Table(totals_data, colWidths=[120, 130])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 2), (1, 2), colors.HexColor("#190954")),   # Green Grand Total
            ('TEXTCOLOR', (0, 2), (1, 2), colors.white),
            ('FONTSIZE', (0, 2), (1, 2), 13),
            ('LINEABOVE', (0, 2), (1, 2), 1.5, colors.grey),
        ]))

        final_section = Table([[gst_box, totals_table]], colWidths=[260, 200])
        elements.append(final_section)
        elements.append(Spacer(1, 25))
        elements.append(Paragraph("______________________________", styles['RightAlign']))
        elements.append(Paragraph("Authorized Signature", styles['RightAlign']))

        # ===================== TERMS & CONDITIONS =====================
        elements.append(Paragraph("<b>Terms & Conditions:</b>", styles['Bold']))
        terms_text = notes or """• Payment due within 15 days.<br/>
        • Delivery within 7 working days.<br/>
        • GST as per government regulations."""
        elements.append(Paragraph(terms_text, styles['Normal']))
        elements.append(Spacer(1, 50))

        # ===================== SIGNATURE =====================
        elements.append(Paragraph(f"For: {company_name}", styles['RightAlign']))
        elements.append(Spacer(1, 25))
        elements.append(Paragraph("______________________________", styles['RightAlign']))
        elements.append(Paragraph("Authorized Signature", styles['RightAlign']))

        # Build PDF
        doc.build(elements)
        pdf_content = buffer.getvalue()
        buffer.close()

        # ===================== SEND EMAIL =====================
        email_subject = f"Quotation {quote_number} - {company_name}"
        email_body = f"Dear {customer_name},\n\nPlease find attached your quotation.\n\nBest regards,\n{company_name}"

        email = EmailMessage(
            subject=email_subject,
            body=email_body,
            from_email=company_email,
            to=[customer_email],
        )
        email.attach(f"Quotation_{quote_number}.pdf", pdf_content, "application/pdf")
        email.send()

        # ===================== SAVE TO DATABASE =====================
        quotation = Quotation.objects.create(
            lead=lead,
            quote_number=quote_number,
            status='sent',
            customer_name=customer_name,
            customer_email=customer_email,
            customer_company=customer_company,
            validity_date=validity_date if 'validity_date' in locals() else None,
            total=subtotal,
            gst_amount=gst_amount,
            grand_total=grand_total,
            notes=notes,
            created_by=request.user,
            pdf_file=ContentFile(pdf_content, f"Quotation_{quote_number}.pdf")
        )

        return Response({
            "detail": "Quotation created and sent successfully!",
            "quotation_id": quotation.id,
            "quote_number": quote_number
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

# sales/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count
from django.contrib.auth import get_user_model

User = get_user_model()        

from apps.organizations.models import OrganizationUser  # ← make sure the import path is correct


class SalesDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        first_day_this_month = today.replace(day=1)

        # Get user's organization safely
        org_user = OrganizationUser.objects.filter(user=user, is_active=True).first()
        organization = org_user.organization if org_user else None

        # Leads Today
        leads_today = Contact.objects.filter(
            organization=organization,
            created_at__date=today,
            status__in=['new', 'contacted', 'qualified', 'interested']
        ).count() if organization else 0

        # Active Opportunities
        active_opportunities = Quotation.objects.filter(
            created_by=user,
            status__in=['sent', 'viewed', 'in_negotiation', 'approved']
        ).count()

        # Quotations Sent Today
        quotations_sent_today = Quotation.objects.filter(
            created_by=user,
            created_at__date=today
        ).count()

        # Pipeline Value
        pipeline_value = Quotation.objects.filter(
            created_by=user,
            status__in=['sent', 'viewed', 'in_negotiation', 'approved']
        ).aggregate(total=Sum('grand_total'))['total'] or 0

        # Won This Month
        won_this_month = SalesOrder.objects.filter(
            created_by=user,
            order_date__gte=first_day_this_month,
            status__in=['confirmed', 'processing', 'shipped', 'delivered']
        ).count()

        data = {
            "leadsToday": leads_today,
            "activeOpportunities": active_opportunities,
            "quotationsSentToday": quotations_sent_today,
            "pipelineValue": f"₹{pipeline_value:,.0f}",
            "wonThisMonth": won_this_month,
            "targetAchievement": "68%",
        }
        return Response(data)


class SalesDashboardMyItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        items = []

        # My Recent Quotations
        for q in Quotation.objects.filter(created_by=user).order_by('-created_at')[:10]:
            items.append({
                "name": f"{q.quote_number} - {q.customer_name}",
                "type": "Quotation",
                "status": q.get_status_display() if hasattr(q, 'get_status_display') else q.status.title(),
                "next": "Follow up" if q.status in ['sent', 'viewed', 'in_negotiation'] else "Close / Convert",
                "value": f"₹{q.grand_total:,.0f}"
            })

        # My Recent Sales Orders
        for order in SalesOrder.objects.filter(created_by=user).order_by('-created_at')[:10]:
            items.append({
                "name": f"{order.order_number} - {order.customer}",
                "type": "Sales Order",
                "status": order.get_status_display() if hasattr(order, 'get_status_display') else order.status.title(),
                "next": "Delivery Follow-up" if order.status in ['confirmed', 'processing'] else "Completed",
                "value": f"₹{order.grand_total:,.0f}"
            })

        return Response(items)


class SalesDashboardTeamPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        first_day_this_month = today.replace(day=1)

        # Permission Check
        if not (
            getattr(user, 'role', None) in ['super_admin', 'sub_org_admin'] or
            getattr(user, 'org_role', None) == 'Sales Head'
        ):
            return Response({"detail": "Permission denied"}, status=403)

        # Get organization safely
        org_user = OrganizationUser.objects.filter(user=user, is_active=True).first()
        if not org_user:
            return Response([])   # Return empty list instead of 400 error

        organization = org_user.organization

        # Get team members
        team_members = User.objects.filter(
            organizationuser__organization=organization,
            organizationuser__is_active=True,
            organizationuser__role__in=['Sales Head', 'Sales Executive', 'Manager', 'Team Lead']
        ).distinct()

        team_data = []

        for member in team_members:
            leads_count = Contact.objects.filter(
                organization=organization,
                created_at__gte=first_day_this_month,
                status__in=['new', 'contacted', 'qualified', 'interested', 'follow_up']
            ).count()

            active_opps = Quotation.objects.filter(
                created_by=member,
                status__in=['sent', 'viewed', 'in_negotiation', 'approved']
            ).count()

            won_count = SalesOrder.objects.filter(
                created_by=member,
                order_date__gte=first_day_this_month,
                status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).count()

            pipeline_value = Quotation.objects.filter(
                created_by=member,
                status__in=['sent', 'viewed', 'in_negotiation', 'approved']
            ).aggregate(total=Sum('grand_total'))['total'] or 0

            achievement = "0%"
            if leads_count > 0:
                achievement = f"{int((won_count / leads_count) * 100)}%"

            team_data.append({
                "name": member.get_full_name() or member.username or "Unknown",
                "leads": leads_count,
                "opps": active_opps,
                "won": won_count,
                "pipeline": f"₹{pipeline_value:,.0f}",
                "achievement": achievement,
            })

        return Response(team_data)