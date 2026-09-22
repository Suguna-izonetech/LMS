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
        admin_role = Role(name="admin", description="Platform Super Administrator", institute_id=institute.id)
        institute_admin_role = Role(name="InstituteAdmin", description="Institute Administrator", institute_id=institute.id)
        teacher_role = Role(name="teacher", description="Course Teacher", institute_id=institute.id)
        student_role = Role(name="student", description="Student", institute_id=institute.id)
        db.add_all([admin_role, institute_admin_role, teacher_role, student_role])
        db.flush()
        print("Created roles: admin, InstituteAdmin, teacher, student")
        
        # Link permissions to admin, institute admin, and teacher
        for perm in db_permissions.values():
            admin_role.permissions.append(perm)
            institute_admin_role.permissions.append(perm)
            teacher_role.permissions.append(perm)
        db.flush()
        
        # 3. Create users
        hashed_pwd = get_password_hash("password123")
        
        # 3.1 Platform Admin user (Unique Superadmin Account)
        platform_admin_user = User(
            institute=institute, 
            username="platform_admin",
            email="platformadmin@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-0001"
        )
        platform_admin_user.roles.append(admin_role)
        db.add(platform_admin_user)

        # 3.2 Institute Admin user (Unique Institute Account)
        institute_admin_user = User(
            institute=institute, 
            username="institute_admin",
            email="instituteadmin@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-0002"
        )
        institute_admin_user.roles.append(institute_admin_role)
        db.add(institute_admin_user)

        # 3.3 Default admin alias (for backward compatibility)
        admin_user = User(
            institute=institute, 
            username="admin",
            email="admin@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-9999"
        )
        admin_user.roles.append(admin_role)
        admin_user.roles.append(institute_admin_role)
        db.add(admin_user)
        
        # 3.4 Teacher user
        teacher_user = User(
            institute=institute, 
            username="teacher",
            email="teacher@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-5555"
        )
        teacher_user.roles.append(teacher_role)
        db.add(teacher_user)
        
        # 3.5 Another teacher (for testing boundaries)
        other_teacher = User(
            institute=institute, 
            username="other_teacher",
            email="other@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-1111"
        )
        other_teacher.roles.append(teacher_role)
        db.add(other_teacher)
        
        # 3.6 Student user
        student_user_entity = User(
            institute=institute, 
            username="student",
            email="student@kite.lms",
            hashed_password=hashed_pwd,
            is_active=True,
            phone="+1-555-0000"
        )
        student_user_entity.roles.append(student_role)
        db.add(student_user_entity)
        
        db.flush()
        print("Created users: platform_admin, institute_admin, admin (alias), teacher, other_teacher, student")
        
        # 4. Courses
        # No mock courses generated by default
        
        # 5. Batches
        # No mock batches generated by default
        
        # 6. Students
        # No mock students generated by default
        
        # 7. Live Classes
        # No mock live classes generated by default
        now = datetime.now()
        
        # 8. Books
        # No mock books generated by default
        
        # 9. Study materials
        # No mock study materials generated by default
        
        # 10. Quizzes
        # No mock quizzes generated by default
        
        # 11. Tasks
        # No mock tasks generated by default
        
        # 12. Webinars
        # No mock webinars generated by default
        
        # 13. Leads
        # No mock leads generated by default

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
        print("Created certificate template")


            
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
        print("Created integrations")

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
        db.commit()
        print("Created billing config")

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
            trigger_payload='{"amount": 1500}',
            status="Success"
        )
        db.add(wf_log)
        db.commit()
        print("Created workflows")

        # Plans Addons
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
        print("Created reports and addons")
        
        # Settings
        inst_settings = InstituteSettings(institute_id=institute.id)
        db.add(inst_settings)
        db.commit()
        print("Created institute settings")





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
