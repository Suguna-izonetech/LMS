import os
import bcrypt
from datetime import datetime, timedelta
# Monkey-patch bcrypt for passlib compatibility in Python 3.12+
try:
    if not hasattr(bcrypt, "__about__"):
        class About:
            __version__ = bcrypt.__version__
        bcrypt.__about__ = About
except Exception:
    pass

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.all_models import (
    Consultation, ConsultationSlot, ConsultationBooking, CertificateTemplate, CertificateRecord, 
    PrerecordedModule, Lecture,
    Institute,
    User, Role, Permission, Course, Batch, Student, LiveClass, 
    LiveClassAttendance, Book, StudyMaterial, Quiz, QuizQuestion, 
    QuizOption, QuizAttempt, QuizAnswer, Task, TaskAttachment, 
    TaskSubmission, Webinar, Lead, LeadFollowup, NewsfeedPost, 
    ChatConversation, ChatParticipant, ChatMessage, Notification, 
    UserNotification, CourseActivity, InstituteIntegration, InstituteBillingConfig, Invoice, Transaction, Workflow, WorkflowAction, WorkflowExecutionLog, ReportHistory, InstitutePlanAddon, InstituteSettings
)
from app.core.security import get_password_hash

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        print("Starting database seeding...")

        # 0. Create Institute
        institute = Institute(name="Kite Institute", subdomain="kite")
        db.add(institute)
        db.flush()
        print("Created Institute")

        
        # 1. Create permissions
        permissions_list = [
            ("teacher.dashboard.view", "View teacher dashboard"),
            ("teacher.courses.view", "View assigned courses"),
            ("teacher.courses.manage", "Manage course content"),
            ("teacher.live_classes.view", "View live classes"),
            ("teacher.live_classes.manage", "Schedule and manage live classes"),
            ("teacher.attendance.view", "View attendance records"),
            ("teacher.attendance.manage", "Mark and export attendance"),
            ("teacher.leads.view", "View assigned leads"),
            ("teacher.students.view", "View students list"),
            ("teacher.newsfeed.view", "View and post on newsfeed"),
            ("teacher.chat.view", "Access one-to-one chat"),
            ("teacher.reports.view", "View student activity reports"),
            ("teacher.settings.manage", "Manage teacher account settings")
        ]
        
        db_permissions = {}
        for name, desc in permissions_list:
            perm = Permission(name=name, description=desc)
            db.add(perm)
            db.flush()
            db_permissions[name] = perm
            print(f"Created permission: {name}")
            
        # 2. Create roles
        teacher_role = Role(name="teacher", description="Course Teacher", institute_id=institute.id)
        institute_admin_role = Role(name="InstituteAdmin", description="Institute Administrator", institute_id=institute.id)
        student_role = Role(name="student", description="Student", institute_id=institute.id)
        db.add(teacher_role)
        db.add(institute_admin_role)
        db.add(student_role)
        db.flush()
        print("Created roles: teacher, InstituteAdmin, student")
        
        # Link permissions to teacher and admin
        for perm in db_permissions.values():
            teacher_role.permissions.append(perm)
            institute_admin_role.permissions.append(perm)
        db.flush()
        
        # 3. Create users
        hashed_pwd = get_password_hash("password123")
        
        # Admin user
        admin_user = User(institute=institute, 
            username="admin",
            email="admin@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-9999"
        )
        admin_user.roles.append(institute_admin_role)
        db.add(admin_user)
        
        # Teacher user
        teacher_user = User(institute=institute, 
            username="teacher",
            email="teacher@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-5555"
        )
        teacher_user.roles.append(teacher_role)
        db.add(teacher_user)
        
        # Another teacher (for testing boundaries)
        other_teacher = User(institute=institute, 
            username="other_teacher",
            email="other@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-1111"
        )
        other_teacher.roles.append(teacher_role)
        db.add(other_teacher)
        
        # Student user
        student_user_entity = User(institute=institute, 
            username="student",
            email="student@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-0000"
        )
        student_user_entity.roles.append(student_role)
        db.add(student_user_entity)
        
        db.flush()
        print("Created users: institute_admin, teacher, other_teacher, student")
        
        # 4. Create courses
        course1 = Course(institute=institute, title="Advanced Web Engineering", code="CS-401", description="React, Node.js, and modern fullstack architectures.")
        course2 = Course(institute=institute, title="Introduction to Python", code="CS-101", description="Foundations of programming, control flow, and scripting.")
        course3 = Course(institute=institute, title="Database Management Systems", code="CS-202", description="SQL, relational algebra, and normalization.")
        restricted_course = Course(institute=institute, title="Advanced Calculus", code="MATH-301", description="Only for math majors. Restrict teacher access.")
        
        db.add(course1)
        db.add(course2)
        db.add(course3)
        db.add(restricted_course)
        db.flush()
        
        # Map teacher to courses 1, 2, and 3
        course1.teachers.append(teacher_user)
        course2.teachers.append(teacher_user)
        course3.teachers.append(teacher_user)
        # Map other teacher to restricted course
        restricted_course.teachers.append(other_teacher)
        db.flush()
        print("Created courses and mapped teachers")
        
        # 5. Create batches
        batch1_a = Batch(institute=institute, name="Batch A", course=course1)
        batch1_b = Batch(institute=institute, name="Batch B", course=course1)
        batch2 = Batch(institute=institute, name="Batch Python", course=course2)
        batch3 = Batch(institute=institute, name="Batch DBMS", course=course3)
        batch_restricted = Batch(institute=institute, name="Batch Math", course=restricted_course)
        
        db.add(batch1_a)
        db.add(batch1_b)
        db.add(batch2)
        db.add(batch3)
        db.add(batch_restricted)
        db.flush()
        print("Created batches")
        
        # 6. Create students
        s1 = Student(institute=institute, name="Alice Smith", email="alice@kite.lms", phone="+1-555-0101", performance="Excellent")
        s2 = Student(institute=institute, name="Bob Jones", email="bob@kite.lms", phone="+1-555-0102", performance="Good")
        s3 = Student(institute=institute, name="Charlie Brown", email="charlie@kite.lms", phone="+1-555-0103", performance="Average")
        s4 = Student(institute=institute, name="Diana Prince", email="diana@kite.lms", phone="+1-555-0104", performance="Excellent")
        s5 = Student(institute=institute, name="Math Student", email="math_stud@kite.lms", phone="+1-555-0105", performance="Good")
        
        db.add(s1)
        db.add(s2)
        db.add(s3)
        db.add(s4)
        db.add(s5)
        db.flush()
        
        # Enroll students in courses
        course1.students.extend([s1, s2])
        course2.students.append(s3)
        course3.students.append(s4)
        restricted_course.students.append(s5)
        db.flush()
        print("Created students and enrolled them in courses")
        
        # 7. Create live classes
        now = datetime.now()
        lc_upcoming = LiveClass(institute=institute, 
            course=course1,
            batch=batch1_a,
            teacher=teacher_user,
            title="React Hooks Deep Dive",
            description="Discussing useState, useEffect, and custom hooks.",
            scheduled_date=now + timedelta(days=1),
            meeting_link="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            status="upcoming"
        )
        lc_live = LiveClass(institute=institute, 
            course=course2,
            batch=batch2,
            teacher=teacher_user,
            title="Python Control Flow Live Session",
            description="If statements, loops, and iterations in Python.",
            scheduled_date=now - timedelta(minutes=10),
            meeting_link="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            status="live"
        )
        lc_completed = LiveClass(institute=institute, 
            course=course3,
            batch=batch3,
            teacher=teacher_user,
            title="Introduction to Relational Algebra",
            description="Operations such as selection, projection, and join.",
            scheduled_date=now - timedelta(days=1),
            meeting_link="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            recording_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            status="completed"
        )
        db.add(lc_upcoming)
        db.add(lc_live)
        db.add(lc_completed)
        db.flush()
        print("Created Live Classes")
        
        # 8. Create attendance records for completed live class
        att1 = LiveClassAttendance(live_class=lc_completed, student=s4, status="present", marked_by=teacher_user.id)
        db.add(att1)
        db.flush()
        print("Created attendance records")
        
        # 9. Create books
        book1 = Book(institute=institute, title="Learning React 2nd Edition", author="Alex Banks", description="A comprehensive guide to React.", file_url="/uploads/learning_react.pdf", status="published", created_by=teacher_user.id)
        book2 = Book(institute=institute, title="Fluent Python", author="Luciano Ramalho", description="Clear and idiomatic Python code book.", file_url="/uploads/fluent_python.pdf", status="published", created_by=teacher_user.id)
        db.add(book1)
        db.add(book2)
        db.flush()
        
        # Map books to courses
        course1.books.append(book1)
        course2.books.append(book2)
        db.flush()
        print("Created and mapped books")
        
        # 10. Create study materials
        mat1 = StudyMaterial(institute=institute, title="React Hooks Handout", description="Summary cheatsheet of React hooks.", file_url="/uploads/hooks_cheatsheet.pdf", course=course1, batch=batch1_a, material_type="Notes", visibility="public", status="published", uploaded_by=teacher_user.id)
        mat2 = StudyMaterial(institute=institute, title="Python Variables Slide deck", description="Lecture 1 slides.", file_url="/uploads/lecture1_slides.pdf", course=course2, batch=batch2, material_type="Slides", visibility="public", status="published", uploaded_by=teacher_user.id)
        db.add(mat1)
        db.add(mat2)
        db.flush()
        print("Created study materials")
        
        # 11. Create quizzes
        q_vars = Quiz(institute=institute, title="Python Variables Quiz", description="Basic quiz to test variable assignments in Python.", course=course2, batch=batch2, duration_minutes=10, total_marks=10, start_date=now - timedelta(days=1), end_date=now + timedelta(days=5), status="published", created_by=teacher_user.id)
        q_react = Quiz(institute=institute, title="React Basics Quiz", description="Draft quiz on React functional components.", course=course1, batch=batch1_a, duration_minutes=15, total_marks=20, start_date=now + timedelta(days=2), end_date=now + timedelta(days=7), status="draft", created_by=teacher_user.id)
        db.add(q_vars)
        db.add(q_react)
        db.flush()
        
        # Add questions to Python Variables Quiz
        q1 = QuizQuestion(quiz=q_vars, question_text="What is the output of: print(type(10))", question_type="multiple_choice", marks=5)
        db.add(q1)
        db.flush()
        
        o1 = QuizOption(question=q1, option_text="<class 'int'>", is_correct=True)
        o2 = QuizOption(question=q1, option_text="<class 'str'>", is_correct=False)
        o3 = QuizOption(question=q1, option_text="<class 'float'>", is_correct=False)
        db.add(o1)
        db.add(o2)
        db.add(o3)
        db.flush()
        
        q2 = QuizQuestion(quiz=q_vars, question_text="Which of the following is a valid variable name in Python?", question_type="multiple_choice", marks=5)
        db.add(q2)
        db.flush()
        
        o4 = QuizOption(question=q2, option_text="my_var", is_correct=True)
        o5 = QuizOption(question=q2, option_text="1myvar", is_correct=False)
        o6 = QuizOption(question=q2, option_text="my-var", is_correct=False)
        db.add(o4)
        db.add(o5)
        db.add(o6)
        db.flush()
        print("Created quizzes, questions, and options")
        
        # 12. Create quiz attempts
        qa1 = QuizAttempt(quiz=q_vars, student=s3, score=10, status="submitted", started_at=now - timedelta(hours=2), completed_at=now - timedelta(hours=1, minutes=45))
        db.add(qa1)
        db.flush()
        
        qans1 = QuizAnswer(attempt=qa1, question=q1, selected_option=o1)
        qans2 = QuizAnswer(attempt=qa1, question=q2, selected_option=o4)
        db.add(qans1)
        db.add(qans2)
        db.flush()
        print("Created quiz attempts and answers")
        
        # 13. Create tasks
        t1 = Task(institute=institute, title="Python Functions Assignment", description="Write a program with helper functions to compute factorial.", course=course2, batch=batch2, teacher=teacher_user, deadline=now + timedelta(days=4), status="published")
        db.add(t1)
        db.flush()
        
        t_attach = TaskAttachment(task=t1, file_name="instructions.pdf", file_url="/uploads/python_assignment_instructions.pdf")
        db.add(t_attach)
        db.flush()
        
        # Create submission
        ts1 = TaskSubmission(task=t1, student=s3, file_url="/uploads/charlie_factorial.py", status="pending")
        db.add(ts1)
        db.flush()
        print("Created tasks, attachments, and submissions")
        
        # 14. Create webinars
        w1 = Webinar(institute=institute, title="Generative AI in modern tech stack", description="A special talk by industry experts.", speaker_name="Dr. Angela Yu", course=course2, scheduled_date=now + timedelta(days=3), meeting_url="https://youtube.com/live/webinar", status="upcoming", created_by=teacher_user.id)
        db.add(w1)
        db.flush()
        print("Created webinars")
        
        # 15. Create leads
        lead1 = Lead(institute=institute, name="John Doe", phone="+1-555-0201", course_interest="Advanced Web Engineering", source="Facebook Ads", status="New", assigned_to=teacher_user.id, notes="Interested in weekend batches.")
        lead2 = Lead(institute=institute, name="Jane Smith", phone="+1-555-0202", course_interest="Introduction to Python", source="Organic Search", status="Contacted", assigned_to=teacher_user.id, notes="Needs syllabus details.")
        lead_other = Lead(institute=institute, name="Restricted Lead", phone="+1-555-0203", course_interest="Advanced Calculus", source="Referral", status="New", assigned_to=other_teacher.id, notes="Assigned to other teacher.")
        
        db.add(lead1)
        db.add(lead2)
        db.add(lead_other)
        db.flush()
        
        lf1 = LeadFollowup(lead=lead1, note="Sent curriculum PDF.", created_by=teacher_user.id)
        db.add(lf1)
        db.flush()
        print("Created CRM leads and followups")

    # Certificates
        ct1 = CertificateTemplate(
            institute_id=institute.id,
            name="Standard Completion",
            title="Certificate of Completion",
            body_text="This is to certify that the student has successfully completed the course.",
            layout="standard"
        )
        db.add(ct1)
        db.commit()
        db.refresh(ct1)
        
        cr1 = CertificateRecord(
            institute_id=institute.id,
            student_id=s1.id,
            course_id=course1.id,
            template_id=ct1.id,
            certificate_number="CERT-20231015-0001",
            status="issued"
        )
        db.add(cr1)
        db.commit()
        print("Created certificates")


            
        # Integrations
        int_email = InstituteIntegration(
            institute_id=institute.id,
            provider_type="email",
            provider_name="smtp",
            credentials_json='{"host":"smtp.example.com","port":587,"user":"admin@example.com","password":"MASKED"}',
            status="Configured"
        )
        int_whatsapp = InstituteIntegration(
            institute_id=institute.id,
            provider_type="whatsapp",
            provider_name="twilio",
            credentials_json='{"account_sid":"ACxxxx","auth_token":"MASKED","phone_number":"+1234567890"}',
            status="Not Configured"
        )
        int_razorpay = InstituteIntegration(
            institute_id=institute.id,
            provider_type="razorpay",
            provider_name="razorpay",
            credentials_json='{"key_id":"rzp_test_xxxx","key_secret":"MASKED"}',
            status="Active"
        )
        db.add_all([int_email, int_whatsapp, int_razorpay])
        db.commit()
        print("Created mock integrations")

        # Billing and Invoices
        billing_config = InstituteBillingConfig(
            institute_id=institute.id,
            gst_enabled=True,
            gst_number="27AADCB2230M1Z2",
            legal_business_name="Kite Learning Solutions Pvt Ltd",
            billing_address="123 Education Lane, Knowledge Park, NY 10001",
            tax_percentage=18.0,
            invoice_prefix="KITE-INV-",
            next_invoice_number=3,
            currency="INR"
        )
        db.add(billing_config)
        db.flush()

        tx1 = Transaction(
            institute_id=institute.id,
            student_id=s1.id,
            course_id=course1.id,
            amount=1500.0,
            currency="INR",
            payment_gateway="razorpay",
            payment_status="Success",
            invoice_reference_id="rzp_test_txn_001"
        )
        db.add(tx1)
        db.flush()
        
        subtotal = 1500.0 / 1.18
        tax_amount = 1500.0 - subtotal
        
        inv1 = Invoice(
            institute_id=institute.id,
            invoice_number="KITE-INV-000001",
            student_id=s1.id,
            course_id=course1.id,
            transaction_id=tx1.id,
            subtotal=round(subtotal, 2),
            tax_amount=round(tax_amount, 2),
            total_amount=1500.0,
            payment_reference="rzp_test_txn_001",
            status="Paid"
        )
        db.add(inv1)
        db.commit()
        print("Created mock billing config and invoices")

        # Workflows
        wf1 = Workflow(
            institute_id=institute.id,
            name="Automated Enrollment on Payment",
            trigger_event="Payment Successful",
            is_active=True,
            conditions='[{"field": "amount", "operator": ">", "value": 0}]'
        )
        db.add(wf1)
        db.flush()
        
        wfa1 = WorkflowAction(
            workflow_id=wf1.id,
            action_type="Create Enrollment",
            action_payload='{"status": "active"}',
            order_index=1
        )
        wfa2 = WorkflowAction(
            workflow_id=wf1.id,
            action_type="Send Email",
            action_payload='{"template": "welcome"}',
            order_index=2
        )
        db.add_all([wfa1, wfa2])
        db.flush()
        
        wf_log = WorkflowExecutionLog(
            workflow_id=wf1.id,
            trigger_payload='{"amount": 1500, "student_id": ' + str(s1.id) + '}',
            status="Success"
        )
        db.add(wf_log)
        db.commit()
        print("Created mock workflows")

        # Reports and Plans
        rh1 = ReportHistory(institute_id=institute.id, report_type="Transaction Report", status="Completed", file_url="/uploads/mock_transaction_report.csv")
        rh2 = ReportHistory(institute_id=institute.id, report_type="User Report", status="Processing", file_url=None)
        db.add_all([rh1, rh2])
        db.flush()

        addons = [
            InstitutePlanAddon(institute_id=institute.id, addon_name="On Domain", status="Active", activation_date=datetime.utcnow()),
            InstitutePlanAddon(institute_id=institute.id, addon_name="Android & iOS App", status="Inactive"),
            InstitutePlanAddon(institute_id=institute.id, addon_name="Nrich Lead Management", status="Inactive"),
            InstitutePlanAddon(institute_id=institute.id, addon_name="WhatsApp", status="Inactive"),
            InstitutePlanAddon(institute_id=institute.id, addon_name="Zoom SDK", status="Active", activation_date=datetime.utcnow()),
            InstitutePlanAddon(institute_id=institute.id, addon_name="WordPress", status="Inactive")
        ]
        db.add_all(addons)
        db.commit()
        print("Created mock reports and addons")
        
        # Settings
        inst_settings = InstituteSettings(institute_id=institute.id)
        db.add(inst_settings)
        db.commit()
        print("Created mock institute settings")





        print("Database seeding completed successfully!")

        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

    # Create uploads directory if it doesn't exist
    os.makedirs("uploads/thumbnails", exist_ok=True)


if __name__ == "__main__":
    seed_data()
