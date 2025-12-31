from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.hr.models import Invoice
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_payslip_pdf(request, invoice_id):
    try:
        invoice = Invoice.objects.select_related(
            'employee',
            'employee__department',
            'employee__designation'
        ).get(
            id=invoice_id,
            employee__organization=request.user.organization
        )
    except Invoice.DoesNotExist:
        return Response({"success": False, "error": "Payslip not found or access denied"}, status=404)

    response = HttpResponse(content_type='application/pdf')
    filename = f"Payslip_{invoice.employee.full_name.replace(' ', '_')}_{invoice.get_month_name()}_{invoice.year}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    doc = SimpleDocTemplate(
        response,
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.8*inch
    )

    styles = getSampleStyleSheet()

    # Professional Colors
    header_blue = colors.HexColor("#003366")      # Deep navy blue
    light_blue = colors.HexColor("#e6f2ff")       # Light blue shade
    dark_gray = colors.HexColor("#333333")
    line_gray = colors.HexColor("#cccccc")

    # Custom Styles
    company_style = ParagraphStyle(
        'CompanyTitle',
        parent=styles['Title'],
        fontSize=20,
        textColor=header_blue,
        alignment=TA_CENTER,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=dark_gray,
        alignment=TA_CENTER,
        spaceAfter=30
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=header_blue,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    label_style = ParagraphStyle('Label', fontSize=11, textColor=dark_gray, fontName='Helvetica-Bold')
    value_style = ParagraphStyle('Value', fontSize=11, textColor=dark_gray)
    amount_style = ParagraphStyle('Amount', fontSize=11, textColor=dark_gray, alignment=TA_RIGHT)
    total_amount_style = ParagraphStyle('TotalAmount', fontSize=12, textColor=header_blue, alignment=TA_RIGHT, fontName='Helvetica-Bold')

    story = []

    # Company Header
    story.append(Paragraph(request.user.organization.name.upper(), company_style))
    story.append(Paragraph("PAYSLIP", ParagraphStyle('PayHeading', fontSize=24, textColor=header_blue, alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold')))
    story.append(Paragraph(f"{request.user.organization.organization_type} • Confidential", subtitle_style))

    # Horizontal line
    story.append(HRFlowable(width="100%", thickness=2, color=header_blue, spaceAfter=20))

    # Employee Details
    info_data = [
        ["Employee Name:", invoice.employee.full_name, "Employee Code:", invoice.employee.employee_code or "N/A"],
        ["Department:", invoice.employee.department.name if invoice.employee.department else "N/A",
         "Designation:", invoice.employee.designation.title if invoice.employee.designation else "N/A"],
        ["Pay Period:", f"{invoice.get_month_name()} {invoice.year}", "Generated Date:", invoice.generated_date.strftime("%d %B %Y")],
    ]

    info_table = Table(info_data, colWidths=[1.5*inch, 2.3*inch, 1.5*inch, 2*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, line_gray),
        ('TEXTCOLOR', (0,0), (0,-1), header_blue),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 30))

    # Earnings Table
    earnings_data = [["Description", "Amount (₹)"]]
    earnings_data += [
        ["Basic Salary", f"{invoice.basic_salary:,.2f}"],
        ["HRA", f"{invoice.hra:,.2f}"],
        ["Medical Allowance", f"{invoice.medical_allowance:,.2f}"],
        ["Conveyance Allowance", f"{invoice.conveyance_allowance:,.2f}"],
        ["Special Allowance", f"{invoice.special_allowance:,.2f}"],
        ["Other Allowances", f"{invoice.other_allowances:,.2f}"],
        ["Gross Earnings", f"{invoice.gross_salary:,.2f}"]
    ]

    earnings_table = Table(earnings_data, colWidths=[4.5*inch, 2*inch])
    earnings_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_blue),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 1, line_gray),
        ('ALIGN', (1,1), (-1,-1), 'RIGHT'),
        ('BACKGROUND', (0,-1), (-1,-1), light_blue),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 12),
    ]))
    story.append(Paragraph("Earnings", heading_style))
    story.append(earnings_table)
    story.append(Spacer(1, 20))

    # Deductions Table
    deductions_data = [["Description", "Amount (₹)"]]
    deductions_data += [
        ["Professional Tax", f"{invoice.professional_tax:,.2f}"],
        ["Income Tax", f"{invoice.income_tax:,.2f}"],
        ["Other Deductions", f"{invoice.other_deductions:,.2f}"],
    ]
    if invoice.esi_employee_amount > 0:
        deductions_data.append(["ESI (Employee)", f"{invoice.esi_employee_amount:,.2f}"])
    if invoice.pf_employee_amount > 0:
        deductions_data.append(["PF (Employee)", f"{invoice.pf_employee_amount:,.2f}"])
    if invoice.pf_voluntary_amount > 0:
        deductions_data.append(["Voluntary PF", f"{invoice.pf_voluntary_amount:,.2f}"])
    deductions_data.append(["Total Deductions", f"{invoice.total_deductions:,.2f}"])

    deductions_table = Table(deductions_data, colWidths=[4.5*inch, 2*inch])
    deductions_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_blue),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 1, line_gray),
        ('ALIGN', (1,1), (-1,-1), 'RIGHT'),
        ('BACKGROUND', (0,-1), (-1,-1), light_blue),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 12),
        ('TEXTCOLOR', (1,-1), (1,-1), colors.red),
    ]))
    story.append(Paragraph("Deductions", heading_style))
    story.append(deductions_table)
    story.append(Spacer(1, 40))

    # Net Pay Box
    net_data = [["Net Salary Payable", f"₹{invoice.net_salary:,.2f}"]]
    net_table = Table(net_data, colWidths=[4.5*inch, 2*inch])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), header_blue),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.white),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 16),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(net_table)

    # Footer
    story.append(Spacer(1, 50))
    footer_style = ParagraphStyle('Footer', fontSize=10, textColor=colors.gray, alignment=TA_CENTER)
    story.append(Paragraph("This is a computer-generated payslip. No signature required.", footer_style))
    story.append(Paragraph("© 2025 ALU-CORE Payroll System", footer_style))

    doc.build(story)
    return response