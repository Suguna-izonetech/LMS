import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        
        # Header (Only on page 2 and later)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#4F46E5"))
            self.drawString(54, 750, "KITE LMS")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(105, 750, "|   Enterprise Multi-Tenant User Guide & Interconnection Architecture")
            
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 742, 558, 742)

        # Footer (On all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 32, "Confidential — KITE LMS Enterprise System Documentation")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

def build_pdf(filename="KITE_LMS_Comprehensive_User_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#1E1B4B")      # Dark Navy/Indigo
    SECONDARY = colors.HexColor("#4F46E5")    # Bright Indigo
    ACCENT = colors.HexColor("#06B6D4")       # Cyan
    TEXT_DARK = colors.HexColor("#0F172A")    # Dark Charcoal
    TEXT_MUTED = colors.HexColor("#475569")   # Slate Grey
    BG_LIGHT = colors.HexColor("#F8FAFC")     # Soft White/Grey
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Border Grey
    
    # Custom Styles
    style_doc_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=TA_LEFT,
        spaceAfter=6
    )
    
    style_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        alignment=TA_LEFT,
        spaceAfter=15
    )
    
    style_h1 = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    
    style_body = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )
    
    style_body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )
    
    style_bullet = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    
    style_callout = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=PRIMARY
    )
    
    style_tbl_header = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=TA_LEFT
    )

    style_tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK
    )

    style_tbl_cell_code = ParagraphStyle(
        'TblCellCode',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8,
        leading=10,
        textColor=SECONDARY
    )

    story = []
    
    # ---------------------------------------------------------
    # COVER / HEADER BANNER
    # ---------------------------------------------------------
    story.append(Spacer(1, 10))
    story.append(Paragraph("🎓 KITE LMS — Enterprise User Guide", style_doc_title))
    story.append(Paragraph("Complete Operational Manual & Interconnected Multi-Tenant Architecture Guide", style_subtitle))
    story.append(HRFlowable(width="100%", thickness=2, color=SECONDARY, spaceBefore=0, spaceAfter=15))
    
    # Overview Box
    overview_html = (
        "<b>System Overview:</b> KITE LMS is a multi-tenant Learning Management System designed for "
        "educational institutes and enterprise training centers. The application segregates access across "
        "<b>4 primary login portals</b> (Platform Admin, Institute Admin, Teacher, Student) while using a unified "
        "data model where CRM leads, course delivery, assessments, billing, and automated workflows seamlessly interconnect."
    )
    
    callout_data = [[Paragraph(overview_html, style_callout)]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('LINELEFT', (0, 0), (-1, -1), 3, SECONDARY),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 12))
    
    # ---------------------------------------------------------
    # SECTION 1: ARCHITECTURE & 4 PRIMARY LOGIN PORTALS
    # ---------------------------------------------------------
    story.append(Paragraph("1. Primary Login Portals & Access Scopes", style_h1))
    story.append(Paragraph(
        "KITE LMS partitions responsibilities into 4 dedicated web portals, each customized for specific administrative, "
        "teaching, or learning activities. All portals share single sign-on (SSO) role authentication with strict tenant isolation.",
        style_body
    ))
    
    portals_data = [
        [
            Paragraph("Portal Role", style_tbl_header),
            Paragraph("Primary Login Route", style_tbl_header),
            Paragraph("Core Responsibilities & Capabilities", style_tbl_header)
        ],
        [
            Paragraph("<b>🛡️ Platform Admin</b>", style_tbl_cell),
            Paragraph("<code>/admin/login</code>", style_tbl_cell_code),
            Paragraph("SaaS ecosystem monitoring, tenant institute provisioning, custom domain assignments, and global add-on feature toggles.", style_tbl_cell)
        ],
        [
            Paragraph("<b>👑 Institute Admin</b>", style_tbl_cell),
            Paragraph("<code>/institute-admin/login</code>", style_tbl_cell_code),
            Paragraph("Curriculum setup, CRM lead pipeline & 1-click enrollment, automated workflow recipes, financial GST billing, and certificate templates.", style_tbl_cell)
        ],
        [
            Paragraph("<b>👩‍🏫 Teacher / Instructor</b>", style_tbl_cell),
            Paragraph("<code>/teacher/login</code> (or <code>/login</code>)", style_tbl_cell_code),
            Paragraph("Assigned course delivery, live virtual class hosting (Zoom/Meet), student attendance tracking, quiz building, and assignment solution file evaluation.", style_tbl_cell)
        ],
        [
            Paragraph("<b>🎓 Student / Learner</b>", style_tbl_cell),
            Paragraph("<code>/student/login</code>", style_tbl_cell_code),
            Paragraph("Enrolled course dashboard, instant 1-click live class join, video module streaming, timed quiz attempts, task submission, and certificate downloads.", style_tbl_cell)
        ]
    ]
    
    tbl_portals = Table(portals_data, colWidths=[110, 124, 270])
    tbl_portals.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl_portals)
    story.append(Spacer(1, 14))

    # ---------------------------------------------------------
    # SECTION 2: END-TO-END INTERCONNECTED WORKFLOW LIFECYCLE
    # ---------------------------------------------------------
    story.append(Paragraph("2. End-to-End Interconnected Data Lifecycle", style_h1))
    story.append(Paragraph(
        "A central strength of KITE LMS is how data flows automatically between modules. The sequence below demonstrates "
        "how a prospective lead moves through CRM, automated workflows, course delivery, assessments, invoicing, and certification:",
        style_body
    ))
    
    steps = [
        ("Step 1: Lead Capture (CRM)", "Inquiry captured via CRM Lead form with student name, contact details, and course interest."),
        ("Step 2: Follow-up & One-Click Enrollment", "Institute Admin or Teacher logs call follow-ups. Clicking 'Enroll Student' converts Lead to a Student record and assigns target Course."),
        ("Step 3: Workflow Trigger Dispatch", "System fires 'Student Enrolled' and 'Course Access Granted' events. WorkflowEngine evaluates recipes and executes configured actions (e.g. welcome email)."),
        ("Step 4: Invoice & Payment Transaction", "Billing Engine computes GST tax (subtotal + tax_amount), generates sequential invoice number (e.g. KITE-INV-000001), and logs successful transaction."),
        ("Step 5: Student Learning & Live Classes", "Student accesses student portal to join scheduled Zoom/Meet live classes. Teacher conducts session and marks attendance (Present/Absent/Late)."),
        ("Step 6: Quizzes & Task Evaluation", "Student submits timed interactive quiz (auto-scored via QuizAnswer keys) and uploads solution files for tasks. Teacher reviews and grades submission."),
        ("Step 7: Automated Certificate Generation", "Upon course completion, system verifies student eligibility and generates verified certificate record (CERT-YYYYMMDD-XXXX) downloadable as PDF.")
    ]
    
    lifecycle_data = [[Paragraph("Lifecycle Step", style_tbl_header), Paragraph("Detailed Functional Interconnection", style_tbl_header)]]
    for title, desc in steps:
        lifecycle_data.append([
            Paragraph(f"<b>{title}</b>", style_tbl_cell),
            Paragraph(desc, style_tbl_cell)
        ])
        
    tbl_lifecycle = Table(lifecycle_data, colWidths=[140, 364])
    tbl_lifecycle.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl_lifecycle)
    story.append(Spacer(1, 14))

    # Page Break for clean detailed module breakdown
    story.append(PageBreak())

    # ---------------------------------------------------------
    # SECTION 3: DETAILED MODULE OPERATIONAL GUIDE
    # ---------------------------------------------------------
    story.append(Paragraph("3. Detailed Module Operational Breakdown", style_h1))
    
    # 3.1 Course & Curriculum Builder
    story.append(Paragraph("3.1 Curriculum & Course Builder", style_h2))
    story.append(Paragraph(
        "Institutes structure learning material using a 4-tier hierarchy: <b>Course → Batch → Prerecorded Module → Lecture</b>.",
        style_body
    ))
    story.append(Paragraph("• <b>Courses</b>: Defines title, code, description, visibility (Public/Private), and status (Draft/Published).", style_bullet))
    story.append(Paragraph("• <b>Batches</b>: Segregates students into active cohort groups (e.g. 'Batch A 2026') for targeted class scheduling.", style_bullet))
    story.append(Paragraph("• <b>Prerecorded Modules & Lectures</b>: Organizes recorded video lessons with custom ordering and video streaming URLs.", style_bullet))
    story.append(Spacer(1, 6))

    # 3.2 Live Classes & Virtual Attendance
    story.append(Paragraph("3.2 Live Classes & Interactive Virtual Meetings", style_h2))
    story.append(Paragraph(
        "Teachers schedule interactive live classes for assigned courses/batches using Zoom, Google Meet, or custom providers.",
        style_body
    ))
    story.append(Paragraph("• <b>1-Click Join</b>: Students see today's live classes on their dashboard with instant 'Join Meeting' buttons.", style_bullet))
    story.append(Paragraph("• <b>Attendance Tracking</b>: Teachers mark attendance (Present, Absent, Late) which updates student performance metrics.", style_bullet))
    story.append(Paragraph("• <b>Session Recordings</b>: Post-class recording URLs are attached to the course portal for student revision.", style_bullet))
    story.append(Spacer(1, 6))

    # 3.3 Assessments: Quizzes & Tasks
    story.append(Paragraph("3.3 Quizzes, Assessments & Task Submissions", style_h2))
    story.append(Paragraph(
        "KITE LMS supports both automated objective evaluation and manual assignment grading.",
        style_body
    ))
    story.append(Paragraph("• <b>Interactive Quizzes</b>: Supports timed multiple-choice questions. Submissions calculate immediate score cards and record <code>QuizAnswer</code> option selections.", style_bullet))
    story.append(Paragraph("• <b>Task Assignments</b>: Teachers post tasks with instructions and file attachments. Students upload solution files before deadlines for teacher review and feedback.", style_bullet))
    story.append(Spacer(1, 6))

    # 3.4 CRM Lead Pipeline & Workflow Recipes
    story.append(Paragraph("3.4 CRM Lead Pipeline & Automated Workflows", style_h2))
    story.append(Paragraph(
        "Captures prospective inquiries and automates institute administrative recipes.",
        style_body
    ))
    story.append(Paragraph("• <b>CRM Lead Pipeline</b>: Tracks lead stages (New, Contacted, Follow-up, Converted). One-click enrollment creates student user accounts instantly.", style_bullet))
    story.append(Paragraph("• <b>Automated Workflow Engine</b>: Configures event-condition-action recipes (e.g. <i>If Payment Received > $0 → Grant Course Access & Send Email</i>) with <code>WorkflowExecutionLog</code> tracking.", style_bullet))
    story.append(Spacer(1, 6))

    # 3.5 Financial Suite & Certificates
    story.append(Paragraph("3.5 Financial Suite, GST Billing & Certificate Engine", style_h2))
    story.append(Paragraph(
        "Enterprise revenue management and automated credential verification.",
        style_body
    ))
    story.append(Paragraph("• <b>GST Billing & Invoices</b>: Configures tax percentage (e.g. 18%), invoice prefixes (e.g. KITE-INV-), auto-incrementing numbers, and generates formal invoice records.", style_bullet))
    story.append(Paragraph("• <b>Verified Certificates</b>: Custom certificate templates issue official completion records with unique reference IDs (<code>CERT-YYYYMMDD-XXXX</code>).", style_bullet))
    story.append(Spacer(1, 14))

    # ---------------------------------------------------------
    # SECTION 4: DEFAULT DEMO CREDENTIALS & API CHEAT-SHEET
    # ---------------------------------------------------------
    story.append(Paragraph("4. Default Test Credentials & Quick Reference", style_h1))
    story.append(Paragraph(
        "After initializing the database via <code>python seed.py</code>, the following default credentials are operational across all 4 login portals:",
        style_body
    ))
    
    creds_data = [
        [Paragraph("Portal Role", style_tbl_header), Paragraph("Username / Email", style_tbl_header), Paragraph("Password", style_tbl_header), Paragraph("Primary Access Scope", style_tbl_header)],
        [Paragraph("<b>Platform Admin</b>", style_tbl_cell), Paragraph("<code>platformadmin@kite.lms</code>", style_tbl_cell_code), Paragraph("<code>password123</code>", style_tbl_cell), Paragraph("Multi-Tenant Management & SaaS Add-ons", style_tbl_cell)],
        [Paragraph("<b>Institute Admin</b>", style_tbl_cell), Paragraph("<code>instituteadmin@kite.lms</code>", style_tbl_cell_code), Paragraph("<code>password123</code>", style_tbl_cell), Paragraph("Curriculum, CRM, Workflows, Billing & Certificates", style_tbl_cell)],
        [Paragraph("<b>Teacher</b>", style_tbl_cell), Paragraph("<code>teacher@kite.lms</code>", style_tbl_cell_code), Paragraph("<code>password123</code>", style_tbl_cell), Paragraph("Assigned Courses, Live Classes, Quizzes & Attendance", style_tbl_cell)],
        [Paragraph("<b>Student</b>", style_tbl_cell), Paragraph("<code>student@kite.lms</code>", style_tbl_cell_code), Paragraph("<code>password123</code>", style_tbl_cell), Paragraph("Learning Dashboard, Live Join, Tasks & Certificates", style_tbl_cell)]
    ]
    
    tbl_creds = Table(creds_data, colWidths=[90, 145, 85, 184])
    tbl_creds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl_creds)
    story.append(Spacer(1, 14))
    
    # Technical Commands Summary
    tech_data = [
        [Paragraph("Operation", style_tbl_header), Paragraph("Command", style_tbl_header), Paragraph("URL / Endpoint", style_tbl_header)],
        [Paragraph("<b>Start Backend</b>", style_tbl_cell), Paragraph("<code>uvicorn app.main:app --reload</code>", style_tbl_cell_code), Paragraph("<code>http://localhost:8000/docs</code>", style_tbl_cell)],
        [Paragraph("<b>Start Frontend</b>", style_tbl_cell), Paragraph("<code>npm run dev</code>", style_tbl_cell_code), Paragraph("<code>http://localhost:5173</code>", style_tbl_cell)],
        [Paragraph("<b>Seed Database</b>", style_tbl_cell), Paragraph("<code>python seed.py</code>", style_tbl_cell_code), Paragraph("Local Database File (<code>test.db</code>)", style_tbl_cell)],
        [Paragraph("<b>Frontend Build</b>", style_tbl_cell), Paragraph("<code>npm run build</code>", style_tbl_cell_code), Paragraph("Production Bundle (<code>dist/</code>)", style_tbl_cell)]
    ]
    
    tbl_tech = Table(tech_data, colWidths=[110, 194, 200])
    tbl_tech.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl_tech)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF User Guide built successfully: {filename}")

if __name__ == '__main__':
    filename = sys.argv[1] if len(sys.argv) > 1 else "KITE_LMS_Comprehensive_User_Guide.pdf"
    build_pdf(filename)
