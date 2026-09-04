import re

file_path = "backend/app/routers/institute_admin.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace top imports
old_import = """from app.models.all_models import User, Course, Student, LiveClass, Batch, Lead"""
new_import = """from app.models.all_models import (
    User, Course, Student, LiveClass, Batch, Lead, LeadFollowup, CertificateRecord, CertificateTemplate, 
    InstituteIntegration, Workflow, WorkflowAction, WorkflowExecutionLog, Transaction, Invoice, 
    InstituteBillingConfig, ReportHistory, InstitutePlanAddon, InstituteSettings, Conversation, Message, 
    Notification, UserNotification, Institute, Permission, Role, user_roles, role_permissions, student_courses, 
    NewsfeedPost, NewsfeedAttachment, PrerecordedModule, Lecture, Book, StudyMaterial, Task, TaskAttachment, 
    Webinar, Consultation, ConsultationSlot, ConsultationBooking
)"""

content = content.replace(old_import, new_import)

# Remove duplicate import at line 33 if present
old_line33 = """from app.models.all_models import LiveClassAttendance, PrerecordedModule, Lecture, Book, StudyMaterial, Task, TaskAttachment, Batch, Webinar, Consultation, ConsultationSlot, ConsultationBooking, Student, Role, user_roles"""
content = content.replace(old_line33, "from app.models.all_models import LiveClassAttendance")

# Add joinedload import
content = content.replace("from sqlalchemy.orm import Session", "from sqlalchemy.orm import Session, joinedload")

# Write helper function right after router declaration
router_decl = 'router = APIRouter(prefix="/institute-admin", tags=["institute-admin"])'
helper_code = '''router = APIRouter(prefix="/institute-admin", tags=["institute-admin"])

def trigger_workflow_event(db: Session, institute_id: int, trigger_event: str, trigger_payload: dict = None):
    """Automated Workflow Engine Execution"""
    if trigger_payload is None:
        trigger_payload = {}
    try:
        active_wfs = db.query(Workflow).filter(
            Workflow.institute_id == institute_id,
            Workflow.trigger_event == trigger_event,
            Workflow.is_active == True
        ).options(joinedload(Workflow.actions)).all()
        
        payload_str = json.dumps(trigger_payload)
        for wf in active_wfs:
            log_entry = WorkflowExecutionLog(
                workflow_id=wf.id,
                trigger_payload=payload_str,
                status="Success"
            )
            db.add(log_entry)
            
            notif = Notification(
                institute_id=institute_id,
                title=f"Workflow Automated: {wf.name}",
                message=f"Event '{trigger_event}' executed automated pipeline.",
                notification_type="System Notification"
            )
            db.add(notif)
        db.commit()
    except Exception as e:
        print(f"[WORKFLOW ENGINE] Error executing workflow event {trigger_event}: {e}")
'''
content = content.replace(router_decl, helper_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated top imports and added workflow engine helper in institute_admin.py")
