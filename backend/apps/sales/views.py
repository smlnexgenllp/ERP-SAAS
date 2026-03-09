from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMessage
from django.utils import timezone
from .serializers import ContactSerializer
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from apps.crm.models import Contact
# from .models import Quotation  # Uncomment and use when you create the model
class QualifiedLeadsListView(APIView):

    def get(self, request):

        leads = Contact.objects.filter(
            organization=request.user.organization,
            status="qualified"
        ).order_by("-created_at")

        serializer = ContactSerializer(leads, many=True)

        return Response(serializer.data)
class QualifiedLeadDetailView(APIView):

    def get(self, request, id):

        lead = Contact.objects.filter(
            organization=request.user.organization
        ).get(id=id)

        serializer = ContactSerializer(lead)

        return Response(serializer.data)
class CreateQuotationFromLeadView(APIView):
    def post(self, request):
        # 1. Get lead_id (required)
        lead_id = request.data.get("lead_id")
        if not lead_id:
            return Response({"detail": "lead_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Fetch the lead (scoped to user's organization)
        try:
            lead = Contact.objects.get(id=lead_id, organization=request.user.organization)
        except Contact.DoesNotExist:
            return Response({"detail": "Lead not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Extract form data with safe defaults
        customer_name    = request.data.get("customer_name",   lead.full_name or "Valued Customer")
        customer_email   = request.data.get("customer_email",  lead.email or "")
        customer_company = request.data.get("customer_company", lead.company or "")
        validity_date    = request.data.get("validity_date",   "")
        items            = request.data.get("items",           [])
        notes            = request.data.get("notes",           "")
        total            = float(request.data.get("total",     0))

        if not customer_email:
            return Response(
                {"detail": "No email address available. Cannot send quotation."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not items or total <= 0:
            return Response(
                {"detail": "Quotation must contain at least one item with valid total."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Company / sender information (you can store this in Organization model)
        organization = request.user.organization
        company_name = organization.name if organization else "Your Company Name"
        company_address = getattr(organization, 'address', "Street Address, City, State, PIN")
        company_phone   = getattr(organization, 'phone', "000-000-0000")
        company_email   = getattr(organization, 'email', "sales@yourcompany.com")
        prepared_by     = request.user.get_full_name() or request.user.username

        # 5. Generate dynamic values
        today = timezone.now().strftime("%d-%m-%Y")
        quote_number = f"QTN-{timezone.now().strftime('%Y%m')}-{lead.id:04d}"  # simple unique number

        # 6. Calculate GST example (change logic as per your requirement)
        gst_rate = 0.18  # 18% GST – make this configurable later
        gst_amount = total * gst_rate
        grand_total = total + gst_amount

        # ──────────────────────────────────────────────────────────────
        # PDF Generation using ReportLab (Platypus – flowables)
        # ──────────────────────────────────────────────────────────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='GreenTitle', textColor=colors.green, fontSize=12, leading=14, spaceAfter=8))
        styles.add(ParagraphStyle(name='YellowTotal', textColor=colors.black, backColor=colors.yellow, fontSize=12, alignment=1, spaceAfter=6))
        styles.add(ParagraphStyle(name='BoldRight', alignment=2, fontSize=11, leading=13))

        elements = []

        # Header – Company Info (left) + Quote Info (right)
        header_data = [
            [
                Paragraph(f"<b>{company_name}</b><br/>{company_address}<br/>Phone: {company_phone}<br/>Email: {company_email}", styles['Normal']),
                Paragraph(
                    f"<font size=14><b>QUOTE</b></font><br/><br/>"
                    f"DATE: {today}<br/>"
                    f"QUOTE #: {quote_number}<br/>"
                    f"VALID UNTIL: {validity_date or '30 days from today'}<br/>"
                    f"PREPARED BY: {prepared_by}",
                    styles['BoldRight']
                )
            ]
        ]
        header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('LEFTPADDING', (0,0), (0,0), 0),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.4*inch))

        # Customer Section
        elements.append(Paragraph("CUSTOMER", styles['GreenTitle']))
        elements.append(Paragraph(
            f"<b>{customer_name}</b><br/>"
            f"{customer_company}<br/>"
            f"{customer_email}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 0.3*inch))

        # Items Table
        table_data = [["DESCRIPTION", "TAXED", "AMOUNT"]]
        for item in items:
            qty = float(item.get('quantity', 1))
            price = float(item.get('unit_price', 0))
            line_total = qty * price
            table_data.append([
                item.get('description', '—'),
                "Yes",  # or calculate actual tax applicability
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
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('TOPPADDING', (0,0), (-1,0), 8),
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
            ('FONTSIZE', (0,0), (-1,-1), 11),
            ('FONTNAME', (0,-1), (1,-1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (1,-1), (1,-1), colors.black),
            ('BACKGROUND', (1,-1), (1,-1), colors.yellow),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 0.4*inch))

        # Terms & Conditions
        elements.append(Paragraph("TERMS AND CONDITIONS", styles['Heading2']))
        terms_text = (
            "1. This quotation is valid until the date mentioned above.<br/>"
            "2. Prices are exclusive of taxes unless stated otherwise.<br/>"
            "3. " + (notes or "No additional notes provided.")
        )
        elements.append(Paragraph(terms_text, styles['Normal']))
        elements.append(Spacer(1, 0.5*inch))

        # Signature line
        elements.append(Paragraph("Acceptance:", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("_______________________________", styles['Normal']))
        elements.append(Paragraph("Customer Signature & Date", styles['Normal']))

        # Build PDF
        doc.build(elements)
        pdf_content = buffer.getvalue()
        buffer.close()

        # 7. Send email
        subject = f"Quotation for {customer_name} – {quote_number}"
        body = (
            f"Dear {customer_name},\n\n"
            f"Please find attached your quotation ({quote_number}).\n"
            f"Valid until: {validity_date or '30 days from today'}\n\n"
            "If you have any questions, feel free to contact us.\n\n"
            "Best regards,\n"
            f"{prepared_by}\n"
            f"{company_name}"
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
                {"detail": f"Quotation PDF generated but email sending failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Optional: Save quotation record
        # Quotation.objects.create(
        #     lead=lead,
        #     quote_number=quote_number,
        #     customer_name=customer_name,
        #     customer_email=customer_email,
        #     total=grand_total,
        #     created_by=request.user,
        #     # pdf_file=ContentFile(pdf_content, f"quotation_{quote_number}.pdf"),
        # )

        return Response(
            {"detail": "Quotation created and email sent successfully", "quote_number": quote_number},
            status=status.HTTP_201_CREATED
        )
        
