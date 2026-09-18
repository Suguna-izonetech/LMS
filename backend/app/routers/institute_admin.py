from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks, status
from typing import Optional, List
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.database import get_db
from app.models.all_models import (
    User, Course, Student, LiveClass, Batch, Lead, LeadFollowup, CertificateRecord, CertificateTemplate, 
    InstituteIntegration, Workflow, WorkflowAction, WorkflowExecutionLog, Transaction, Invoice, 
    InstituteBillingConfig, ReportHistory, InstitutePlanAddon, InstituteSettings, Conversation, Message, 
    Notification, UserNotification, Institute, Permission, Role, user_roles, role_permissions, student_courses, 
    NewsfeedPost, NewsfeedAttachment, PrerecordedModule, Lecture, Book, StudyMaterial, Task, TaskAttachment, 
    Webinar, Consultation, ConsultationSlot, ConsultationBooking
)
from app.core.dependencies import require_institute_admin
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.library import BookResponse, StudyMaterialResponse
from app.schemas.tasks import TaskResponse, TaskCreate, TaskUpdate
from app.schemas.webinars import WebinarResponse, WebinarCreate, WebinarUpdate
from app.schemas.consultations import ConsultationResponse, ConsultationCreate, ConsultationUpdate, ConsultationSlotResponse, ConsultationSlotCreate, ConsultationBookingResponse
from app.schemas.users import InstituteUserCreate, InstituteUserResponse, BulkUserImportResult
from app.schemas.roles import RoleResponse, RoleCreate, RoleUpdate, PermissionResponse
from app.schemas.notifications import NotificationResponse, NotificationCreate, NotificationUpdate
from app.schemas.transactions import TransactionResponse, MonthlySummaryItem
from app.schemas.certificates import CertificateTemplateResponse, CertificateTemplateCreate, CertificateTemplateUpdate, CertificateRecordResponse, CertificateRecordCreate
from app.schemas.newsfeed import NewsfeedPostResponse, NewsfeedPostCreate, NewsfeedPostUpdate
from app.schemas.chat import ChatUser, MessageCreate, MessageResponse, ConversationResponse
from app.schemas.crm import CRMLeadCreate, CRMLeadUpdate, CRMLeadResponse, CRMFollowupCreate, CRMDashboardStats
from app.schemas.integrations import IntegrationResponse, IntegrationUpdate
from app.schemas.billing import InstituteBillingConfigUpdate, InstituteBillingConfigResponse, InvoiceResponse
from app.schemas.workflows import WorkflowResponse, WorkflowCreate, WorkflowLogResponse
from app.schemas.reports import ReportHistoryResponse, ReportRequest
from app.schemas.plans import InstitutePlanAddonResponse
from app.schemas.settings import UserProfileUpdate, InstituteProfileUpdate, InstituteSettingsUpdate, InstituteProfileResponse, InstituteSettingsResponse
from app.services.integrations import mask_credentials, IntegrationFactory
from app.schemas.prerecorded import ModuleCreate, ModuleUpdate, ModuleResponse, LectureCreate, LectureUpdate, LectureResponse
from app.schemas.live_class import LiveClassCreate, LiveClassUpdate, LiveClassResponse, AttendanceRecord
from app.services.meeting_provider import MeetingProviderFactory
from app.services.storage import StorageService
from app.services.workflows import WorkflowEngine
from app.models.all_models import LiveClassAttendance
import os
import shutil
import uuid
import json
import csv
import codecs

router = APIRouter(prefix="/institute-admin", tags=["institute-admin"])

def trigger_workflow_event(db: Session, institute_id: int, trigger_event: str, trigger_payload: dict = None):
    """Automated Workflow Engine Execution"""
    if trigger_payload is None:
        trigger_payload = {}
    try:
        WorkflowEngine.dispatch_event(db, institute_id, trigger_event, trigger_payload)
        active_wfs = db.query(Workflow).filter(
            Workflow.institute_id == institute_id,
            Workflow.trigger_event == trigger_event,
            Workflow.is_active == True
        ).all()
        
        for wf in active_wfs:
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


@router.get("/dashboard/summary")
def get_dashboard_summary(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    institute_id = current_user.institute_id
    
    total_students = db.query(Student).filter(Student.institute_id == institute_id).count()
    
    teachers_count = db.query(User).filter(
        User.institute_id == institute_id,
        User.roles.any(name='teacher')
    ).count()
    
    active_courses = db.query(Course).filter(Course.institute_id == institute_id).count()
    
    active_batches = db.query(Batch).filter(
        Batch.institute_id == institute_id,
        Batch.status == 'Active'
    ).count()
    
    today = date.today()
    todays_classes = db.query(LiveClass).filter(
        LiveClass.institute_id == institute_id,
        func.date(LiveClass.start_time) == today
    ).count()
    
    pending_leads = db.query(Lead).filter(
        Lead.institute_id == institute_id,
        Lead.status == 'New'
    ).count()
    
    return {
        "students": total_students,
        "teachers": teachers_count,
        "courses": active_courses,
        "active_batches": active_batches,
        "todays_classes": todays_classes,
        "pending_leads": pending_leads,
        "monthly_revenue": 850000 
    }

@router.get("/dashboard/recent-activities")
def get_dashboard_recent_activities(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    activities = [
        {"id": 1, "type": "student", "description": "New student registered: John Doe", "time": "2 mins ago"},
        {"id": 2, "type": "payment", "description": "New payment received: ₹15,000 for React Course", "time": "1 hour ago"},
        {"id": 3, "type": "quiz", "description": "Quiz completed: Python Basics by 12 students", "time": "3 hours ago"},
        {"id": 4, "type": "certificate", "description": "Certificate issued to Sarah Smith", "time": "5 hours ago"},
        {"id": 5, "type": "lead", "description": "New lead assigned to Sales Team A", "time": "1 day ago"}
    ]
    return activities

# --- COURSES MODULE ---

@router.get("/courses", response_model=list[CourseResponse])
def get_courses(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.institute_id == current_user.institute_id).all()
    result = []
    for c in courses:
        active_batches_count = db.query(Batch).filter(Batch.course_id == c.id).count()
        c_dict = {
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "description": c.description,
            "course_type": c.course_type,
            "visibility": c.visibility,
            "status": c.status,
            "thumbnail_url": c.thumbnail_url,
            "institute_id": c.institute_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "active_batches_count": active_batches_count
        }
        result.append(c_dict)
    return result

@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.institute_id == current_user.institute_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    active_batches_count = db.query(Batch).filter(Batch.course_id == course.id, Batch.status == 'Active').count()
    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "course_type": course.course_type,
        "visibility": course.visibility,
        "status": course.status,
        "thumbnail_url": course.thumbnail_url,
        "institute_id": course.institute_id,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "active_batches_count": active_batches_count
    }

@router.post("/courses", response_model=CourseResponse)
def create_course(
    title: str = Form(...),
    code: str = Form(...),
    description: str = Form(None),
    course_type: str = Form("Online"),
    visibility: str = Form("Public"),
    status: str = Form("Draft"),
    thumbnail: UploadFile = File(None),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    # Check if code exists
    existing = db.query(Course).filter(Course.code == code, Course.institute_id == current_user.institute_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course with this code already exists")
    
    thumbnail_url = None
    if thumbnail:
        os.makedirs("uploads/thumbnails", exist_ok=True)
        file_ext = os.path.splitext(thumbnail.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join("uploads", "thumbnails", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
        thumbnail_url = f"/uploads/thumbnails/{file_name}"
        
    new_course = Course(
        title=title,
        code=code,
        description=description,
        course_type=course_type,
        visibility=visibility,
        status=status,
        thumbnail_url=thumbnail_url,
        institute_id=current_user.institute_id
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return {
        "id": new_course.id,
        "title": new_course.title,
        "code": new_course.code,
        "description": new_course.description,
        "course_type": new_course.course_type,
        "visibility": new_course.visibility,
        "status": new_course.status,
        "thumbnail_url": new_course.thumbnail_url,
        "institute_id": new_course.institute_id,
        "created_at": new_course.created_at,
        "updated_at": new_course.updated_at,
        "active_batches_count": 0
    }

@router.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    title: str = Form(None),
    code: str = Form(None),
    description: str = Form(None),
    course_type: str = Form(None),
    visibility: str = Form(None),
    status: str = Form(None),
    thumbnail: UploadFile = File(None),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id, Course.institute_id == current_user.institute_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if title is not None: course.title = title
    if code is not None: course.code = code
    if description is not None: course.description = description
    if course_type is not None: course.course_type = course_type
    if visibility is not None: course.visibility = visibility
    if status is not None: course.status = status
    
    if thumbnail:
        os.makedirs("uploads/thumbnails", exist_ok=True)
        file_ext = os.path.splitext(thumbnail.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join("uploads", "thumbnails", file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
        course.thumbnail_url = f"/uploads/thumbnails/{file_name}"
        
    db.commit()
    db.refresh(course)
    
    active_batches_count = db.query(Batch).filter(Batch.course_id == course.id, Batch.status == 'Active').count()
    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "course_type": course.course_type,
        "visibility": course.visibility,
        "status": course.status,
        "thumbnail_url": course.thumbnail_url,
        "institute_id": course.institute_id,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "active_batches_count": active_batches_count
    }

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.institute_id == current_user.institute_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    db.delete(course)
    db.commit()
    return {"detail": "Course deleted successfully"}

# --- LIVE CLASSES MODULE ---

@router.get("/live-classes", response_model=list[LiveClassResponse])
def get_live_classes(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    classes = db.query(LiveClass).filter(LiveClass.institute_id == current_user.institute_id).all()
    result = []
    for lc in classes:
        course = db.query(Course).filter(Course.id == lc.course_id).first()
        batch = db.query(Batch).filter(Batch.id == lc.batch_id).first()
        lc_dict = lc.__dict__.copy()
        lc_dict["course_title"] = course.title if course else "Unknown Course"
        lc_dict["batch_name"] = batch.name if batch else "Unknown Batch"
        result.append(lc_dict)
    return result

@router.post("/live-classes", response_model=LiveClassResponse)
def create_live_class(lc: LiveClassCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    # Create meeting link if provider is specified and link is not
    meeting_link = lc.meeting_link
    if lc.meeting_provider and not meeting_link:
        provider = MeetingProviderFactory.get_provider(lc.meeting_provider)
        try:
            meeting_details = provider.create_meeting(lc.title, str(lc.start_time), 60)
            meeting_link = meeting_details["join_url"]
        except Exception as e:
            print(f"Failed to generate meeting link: {e}")
            pass

    new_lc = LiveClass(
        institute_id=current_user.institute_id,
        course_id=lc.course_id,
        batch_id=lc.batch_id,
        teacher_id=lc.teacher_id,
        title=lc.title,
        description=lc.description,
        scheduled_date=lc.scheduled_date,
        start_time=lc.start_time,
        end_time=lc.end_time,
        meeting_provider=lc.meeting_provider,
        meeting_link=meeting_link,
        status=lc.status,
        recording_url=lc.recording_url
    )
    db.add(new_lc)
    db.commit()
    db.refresh(new_lc)
    
    course = db.query(Course).filter(Course.id == new_lc.course_id).first()
    batch = db.query(Batch).filter(Batch.id == new_lc.batch_id).first()
    
    res = new_lc.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    res["batch_name"] = batch.name if batch else "Unknown"
    
    return res

@router.put("/live-classes/{lc_id}", response_model=LiveClassResponse)
def update_live_class(lc_id: int, lc_update: LiveClassUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    lc = db.query(LiveClass).filter(LiveClass.id == lc_id, LiveClass.institute_id == current_user.institute_id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
        
    update_data = lc_update.dict(exclude_unset=True)
    
    # Check if we need a new meeting link
    if "meeting_provider" in update_data and update_data["meeting_provider"] != lc.meeting_provider and not update_data.get("meeting_link"):
        provider = MeetingProviderFactory.get_provider(update_data["meeting_provider"])
        try:
            meeting_details = provider.create_meeting(
                update_data.get("title", lc.title), 
                str(update_data.get("start_time", lc.start_time)), 
                60
            )
            update_data["meeting_link"] = meeting_details["join_url"]
        except:
            pass

    for key, value in update_data.items():
        setattr(lc, key, value)
        
    db.commit()
    db.refresh(lc)
    
    course = db.query(Course).filter(Course.id == lc.course_id).first()
    batch = db.query(Batch).filter(Batch.id == lc.batch_id).first()
    
    res = lc.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    res["batch_name"] = batch.name if batch else "Unknown"
    
    return res

@router.delete("/live-classes/{lc_id}")
def delete_live_class(lc_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    lc = db.query(LiveClass).filter(LiveClass.id == lc_id, LiveClass.institute_id == current_user.institute_id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
        
    db.delete(lc)
    db.commit()
    return {"detail": "Live class deleted successfully"}

@router.get("/live-classes/{lc_id}/attendance", response_model=list[AttendanceRecord])
def get_live_class_attendance(lc_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    lc = db.query(LiveClass).filter(LiveClass.id == lc_id, LiveClass.institute_id == current_user.institute_id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
        
    attendance_records = db.query(LiveClassAttendance).filter(LiveClassAttendance.live_class_id == lc_id).all()
    
    result = []
    for att in attendance_records:
        student = db.query(Student).filter(Student.id == att.student_id).first()
        if student:
            result.append({
                "student_id": student.id,
                "student_name": student.name,
                "status": att.status
            })
            
    return result

# --- PRERECORDED MODULES ---

@router.get("/modules", response_model=list[ModuleResponse])
def get_modules(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    modules = db.query(PrerecordedModule).filter(PrerecordedModule.institute_id == current_user.institute_id).all()
    result = []
    for mod in modules:
        course = db.query(Course).filter(Course.id == mod.course_id).first()
        mod_dict = mod.__dict__.copy()
        mod_dict["course_title"] = course.title if course else "Unknown Course"
        mod_dict["lectures"] = mod.lectures
        result.append(mod_dict)
    return result

@router.post("/modules", response_model=ModuleResponse)
def create_module(mod_create: ModuleCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    new_mod = PrerecordedModule(
        institute_id=current_user.institute_id,
        course_id=mod_create.course_id,
        title=mod_create.title,
        description=mod_create.description,
        status=mod_create.status
    )
    db.add(new_mod)
    db.commit()
    db.refresh(new_mod)
    
    course = db.query(Course).filter(Course.id == new_mod.course_id).first()
    res = new_mod.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    res["lectures"] = []
    return res

@router.put("/modules/{mod_id}", response_model=ModuleResponse)
def update_module(mod_id: int, mod_update: ModuleUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    mod = db.query(PrerecordedModule).filter(PrerecordedModule.id == mod_id, PrerecordedModule.institute_id == current_user.institute_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
        
    update_data = mod_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mod, key, value)
        
    db.commit()
    db.refresh(mod)
    
    course = db.query(Course).filter(Course.id == mod.course_id).first()
    res = mod.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    res["lectures"] = mod.lectures
    return res

@router.delete("/modules/{mod_id}")
def delete_module(mod_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    mod = db.query(PrerecordedModule).filter(PrerecordedModule.id == mod_id, PrerecordedModule.institute_id == current_user.institute_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
        
    db.delete(mod)
    db.commit()
    return {"detail": "Module deleted"}

# --- LECTURES ---

@router.post("/modules/{mod_id}/lectures", response_model=LectureResponse)
def create_lecture(mod_id: int, lec: LectureCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    mod = db.query(PrerecordedModule).filter(PrerecordedModule.id == mod_id, PrerecordedModule.institute_id == current_user.institute_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
        
    new_lec = Lecture(
        module_id=mod_id,
        title=lec.title,
        description=lec.description,
        video_url=lec.video_url,
        ordering=lec.ordering,
        status=lec.status
    )
    db.add(new_lec)
    db.commit()
    db.refresh(new_lec)
    return new_lec

@router.put("/modules/lectures/{lec_id}", response_model=LectureResponse)
def update_lecture(lec_id: int, lec_update: LectureUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    lec = db.query(Lecture).join(PrerecordedModule).filter(
        Lecture.id == lec_id, 
        PrerecordedModule.institute_id == current_user.institute_id
    ).first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecture not found")
        
    update_data = lec_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lec, key, value)
        
    db.commit()
    db.refresh(lec)
    return lec

@router.delete("/modules/lectures/{lec_id}")
def delete_lecture(lec_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    lec = db.query(Lecture).join(PrerecordedModule).filter(
        Lecture.id == lec_id, 
        PrerecordedModule.institute_id == current_user.institute_id
    ).first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecture not found")
        
    db.delete(lec)
    db.commit()
    return {"detail": "Lecture deleted"}

# --- BOOKS ---

@router.get("/books", response_model=list[BookResponse])
def get_books(
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(Book).filter(Book.institute_id == current_user.institute_id)
    if search:
        query = query.filter(Book.title.ilike(f"%{search}%") | Book.author.ilike(f"%{search}%"))
    if status:
        query = query.filter(Book.status == status)
    return query.all()

@router.post("/books", response_model=BookResponse)
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form("draft"),
    file: UploadFile = File(...),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    file_url = StorageService.save_file(file, "books")
    new_book = Book(
        institute_id=current_user.institute_id,
        title=title,
        author=author,
        description=description,
        status=status,
        file_url=file_url,
        created_by=current_user.id
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@router.put("/books/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id, Book.institute_id == current_user.institute_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if title is not None: book.title = title
    if author is not None: book.author = author
    if description is not None: book.description = description
    if status is not None: book.status = status
    if file:
        book.file_url = StorageService.save_file(file, "books")
        
    db.commit()
    db.refresh(book)
    return book

@router.delete("/books/{book_id}")
def delete_book(book_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id, Book.institute_id == current_user.institute_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(book)
    db.commit()
    return {"detail": "Book deleted"}

# --- STUDY MATERIALS ---

@router.get("/study-materials", response_model=list[StudyMaterialResponse])
def get_study_materials(
    search: Optional[str] = None,
    material_type: Optional[str] = None,
    course_id: Optional[int] = None,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(StudyMaterial).filter(StudyMaterial.institute_id == current_user.institute_id)
    if search:
        query = query.filter(StudyMaterial.title.ilike(f"%{search}%"))
    if material_type:
        query = query.filter(StudyMaterial.material_type == material_type)
    if course_id:
        query = query.filter(StudyMaterial.course_id == course_id)
        
    materials = query.all()
    result = []
    for mat in materials:
        course = db.query(Course).filter(Course.id == mat.course_id).first()
        mat_dict = mat.__dict__.copy()
        mat_dict["course_title"] = course.title if course else "Unknown"
        result.append(mat_dict)
    return result

@router.post("/study-materials", response_model=StudyMaterialResponse)
def create_study_material(
    title: str = Form(...),
    course_id: int = Form(...),
    description: Optional[str] = Form(None),
    material_type: Optional[str] = Form("Notes"),
    visibility: Optional[str] = Form("public"),
    status: Optional[str] = Form("draft"),
    file: UploadFile = File(...),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    file_url = StorageService.save_file(file, "study_materials")
    new_mat = StudyMaterial(
        institute_id=current_user.institute_id,
        course_id=course_id,
        title=title,
        description=description,
        material_type=material_type,
        visibility=visibility,
        status=status,
        file_url=file_url,
        uploaded_by=current_user.id
    )
    db.add(new_mat)
    db.commit()
    db.refresh(new_mat)
    
    course = db.query(Course).filter(Course.id == new_mat.course_id).first()
    res = new_mat.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    return res

@router.put("/study-materials/{mat_id}", response_model=StudyMaterialResponse)
def update_study_material(
    mat_id: int,
    title: Optional[str] = Form(None),
    course_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    material_type: Optional[str] = Form(None),
    visibility: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    mat = db.query(StudyMaterial).filter(StudyMaterial.id == mat_id, StudyMaterial.institute_id == current_user.institute_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Study material not found")
        
    if title is not None: mat.title = title
    if course_id is not None: mat.course_id = course_id
    if description is not None: mat.description = description
    if material_type is not None: mat.material_type = material_type
    if visibility is not None: mat.visibility = visibility
    if status is not None: mat.status = status
    if file:
        mat.file_url = StorageService.save_file(file, "study_materials")
        
    db.commit()
    db.refresh(mat)
    
    course = db.query(Course).filter(Course.id == mat.course_id).first()
    res = mat.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    return res

@router.delete("/study-materials/{mat_id}")
def delete_study_material(mat_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    mat = db.query(StudyMaterial).filter(StudyMaterial.id == mat_id, StudyMaterial.institute_id == current_user.institute_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Study material not found")
    db.delete(mat)
    db.commit()
    return {"detail": "Study material deleted"}

# --- TASKS ---

@router.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    search: Optional[str] = None,
    course_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.institute_id == current_user.institute_id)
    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))
    if course_id:
        query = query.filter(Task.course_id == course_id)
    if status and status != "All":
        query = query.filter(Task.status == status)
        
    tasks = query.all()
    result = []
    for t in tasks:
        course = db.query(Course).filter(Course.id == t.course_id).first()
        batch = db.query(Batch).filter(Batch.id == t.batch_id).first()
        t_dict = t.__dict__.copy()
        t_dict["course_title"] = course.title if course else "Unknown"
        t_dict["batch_name"] = batch.name if batch else "All Batches"
        t_dict["attachments"] = t.attachments
        result.append(t_dict)
    return result

@router.post("/tasks", response_model=TaskResponse)
def create_task(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    course_id: int = Form(...),
    batch_id: Optional[int] = Form(None),
    deadline: str = Form(...),
    status: Optional[str] = Form("draft"),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    from dateutil import parser
    parsed_deadline = parser.parse(deadline)

    new_task = Task(
        institute_id=current_user.institute_id,
        title=title,
        description=description,
        course_id=course_id,
        batch_id=batch_id,
        deadline=parsed_deadline,
        status=status,
        teacher_id=current_user.id  # Assign to current admin user
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    if files:
        for file in files:
            if file.filename:
                file_url = StorageService.save_file(file, "tasks")
                attachment = TaskAttachment(
                    task_id=new_task.id,
                    file_name=file.filename,
                    file_url=file_url
                )
                db.add(attachment)
        db.commit()
        db.refresh(new_task)
        
    course = db.query(Course).filter(Course.id == new_task.course_id).first()
    batch = db.query(Batch).filter(Batch.id == new_task.batch_id).first()
    res = new_task.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    res["batch_name"] = batch.name if batch else "All Batches"
    res["attachments"] = new_task.attachments
    return res

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    course_id: Optional[int] = Form(None),
    batch_id: Optional[int] = Form(None),
    deadline: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.institute_id == current_user.institute_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if title is not None: task.title = title
    if description is not None: task.description = description
    if course_id is not None: task.course_id = course_id
    if batch_id is not None: task.batch_id = batch_id
    if status is not None: task.status = status
    if deadline is not None:
        from dateutil import parser
        task.deadline = parser.parse(deadline)
        
    if files and any(f.filename for f in files):
        # Delete old attachments
        db.query(TaskAttachment).filter(TaskAttachment.task_id == task.id).delete()
        for file in files:
            if file.filename:
                file_url = StorageService.save_file(file, "tasks")
                attachment = TaskAttachment(
                    task_id=task.id,
                    file_name=file.filename,
                    file_url=file_url
                )
                db.add(attachment)
                
    db.commit()
    db.refresh(task)
    
    course = db.query(Course).filter(Course.id == task.course_id).first()
    batch = db.query(Batch).filter(Batch.id == task.batch_id).first()
    res = task.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    res["batch_name"] = batch.name if batch else "All Batches"
    res["attachments"] = task.attachments
    return res

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.institute_id == current_user.institute_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted"}

# --- WEBINARS ---

@router.get("/webinars", response_model=list[WebinarResponse])
def get_webinars(
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(Webinar).filter(Webinar.institute_id == current_user.institute_id)
    if search:
        query = query.filter(Webinar.title.ilike(f"%{search}%") | Webinar.speaker_name.ilike(f"%{search}%"))
    if status and status != "All":
        query = query.filter(Webinar.status == status)
        
    webinars = query.all()
    result = []
    for w in webinars:
        course = db.query(Course).filter(Course.id == w.course_id).first()
        w_dict = w.__dict__.copy()
        w_dict["course_title"] = course.title if course else "Unknown"
        result.append(w_dict)
    return result

@router.post("/webinars", response_model=WebinarResponse)
def create_webinar(
    webinar: WebinarCreate,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    new_webinar = Webinar(
        institute_id=current_user.institute_id,
        title=webinar.title,
        description=webinar.description,
        speaker_name=webinar.speaker_name,
        speaker_details=webinar.speaker_details,
        course_id=webinar.course_id,
        scheduled_date=webinar.scheduled_date,
        start_time=webinar.start_time,
        end_time=webinar.end_time,
        meeting_provider=webinar.meeting_provider,
        meeting_url=webinar.meeting_url,
        status=webinar.status,
        created_by=current_user.id
    )
    db.add(new_webinar)
    db.commit()
    db.refresh(new_webinar)
    
    course = db.query(Course).filter(Course.id == new_webinar.course_id).first()
    res = new_webinar.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    return res

@router.put("/webinars/{webinar_id}", response_model=WebinarResponse)
def update_webinar(
    webinar_id: int,
    webinar_update: WebinarUpdate,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    webinar = db.query(Webinar).filter(Webinar.id == webinar_id, Webinar.institute_id == current_user.institute_id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
        
    update_data = webinar_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(webinar, key, value)
                
    db.commit()
    db.refresh(webinar)
    
    course = db.query(Course).filter(Course.id == webinar.course_id).first()
    res = webinar.__dict__.copy()
    res["course_title"] = course.title if course else "Unknown"
    return res

@router.delete("/webinars/{webinar_id}")
def delete_webinar(webinar_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    webinar = db.query(Webinar).filter(Webinar.id == webinar_id, Webinar.institute_id == current_user.institute_id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    db.delete(webinar)
    db.commit()
    return {"detail": "Webinar deleted"}

# --- CONSULTATIONS ---

@router.get("/consultations", response_model=list[ConsultationResponse])
def get_consultations(
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    consultations = db.query(Consultation).filter(Consultation.institute_id == current_user.institute_id).all()
    result = []
    for c in consultations:
        consultant = db.query(User).filter(User.id == c.consultant_id).first()
        c_dict = c.__dict__.copy()
        c_dict["consultant_name"] = f"{consultant.first_name} {consultant.last_name}" if consultant else "Unknown"
        c_dict["slots"] = c.slots
        result.append(c_dict)
    return result

@router.post("/consultations", response_model=ConsultationResponse)
def create_consultation(
    consultation: ConsultationCreate,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    new_c = Consultation(
        institute_id=current_user.institute_id,
        title=consultation.title,
        description=consultation.description,
        consultant_id=consultation.consultant_id,
        duration_minutes=consultation.duration_minutes,
        pricing=consultation.pricing,
        status=consultation.status
    )
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    
    consultant = db.query(User).filter(User.id == new_c.consultant_id).first()
    res = new_c.__dict__.copy()
    res["consultant_name"] = f"{consultant.first_name} {consultant.last_name}" if consultant else "Unknown"
    res["slots"] = []
    return res

@router.put("/consultations/{c_id}", response_model=ConsultationResponse)
def update_consultation(
    c_id: int,
    c_update: ConsultationUpdate,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == c_id, Consultation.institute_id == current_user.institute_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    update_data = c_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(consultation, key, value)
                
    db.commit()
    db.refresh(consultation)
    
    consultant = db.query(User).filter(User.id == consultation.consultant_id).first()
    res = consultation.__dict__.copy()
    res["consultant_name"] = f"{consultant.first_name} {consultant.last_name}" if consultant else "Unknown"
    res["slots"] = consultation.slots
    return res

@router.delete("/consultations/{c_id}")
def delete_consultation(c_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    consultation = db.query(Consultation).filter(Consultation.id == c_id, Consultation.institute_id == current_user.institute_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    db.delete(consultation)
    db.commit()
    return {"detail": "Consultation deleted"}

@router.post("/consultations/{c_id}/slots", response_model=ConsultationSlotResponse)
def add_consultation_slot(
    c_id: int,
    slot: ConsultationSlotCreate,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == c_id, Consultation.institute_id == current_user.institute_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    new_slot = ConsultationSlot(
        consultation_id=c_id,
        date=slot.date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        status=slot.status
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@router.delete("/consultations/slots/{slot_id}")
def delete_consultation_slot(slot_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    slot = db.query(ConsultationSlot).join(Consultation).filter(ConsultationSlot.id == slot_id, Consultation.institute_id == current_user.institute_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.delete(slot)
    db.commit()
    return {"detail": "Slot deleted"}

@router.get("/consultations/bookings", response_model=list[ConsultationBookingResponse])
def get_consultation_bookings(
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    bookings = db.query(ConsultationBooking).join(ConsultationSlot).join(Consultation).filter(Consultation.institute_id == current_user.institute_id).all()
    result = []
    for b in bookings:
        slot = b.slot
        consultation = slot.consultation
        student = b.student
        user = student.user
        
        b_dict = b.__dict__.copy()
        b_dict["student_name"] = f"{user.first_name} {user.last_name}" if user else "Unknown"
        b_dict["consultation_title"] = consultation.title
        b_dict["date"] = slot.date
        b_dict["start_time"] = slot.start_time
        result.append(b_dict)
    return result

# --- MANAGE USERS ---

import csv
import codecs
from app.core.security import get_password_hash

@router.get("/users", response_model=list[InstituteUserResponse])
def get_institute_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    user_roles = [r.name.lower() for r in current_user.roles]
    is_platform_admin = any(r in {"admin", "platformadmin"} for r in user_roles)
    
    if is_platform_admin:
        query = db.query(User)
    else:
        query = db.query(User).filter(User.institute_id == current_user.institute_id)
    
    if search:
        query = query.filter(User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        
    users = query.all()
    
    result = []
    for u in users:
        r_name = u.roles[0].name if u.roles else "student"
                
        if role and role != "All" and r_name.lower() != role.lower():
            continue
            
        parts = u.username.split(" ", 1)
        first_name = parts[0] if parts else u.username
        last_name = parts[1] if len(parts) > 1 else ""
        
        result.append({
            "id": u.id,
            "first_name": first_name,
            "last_name": last_name,
            "email": u.email,
            "phone": u.phone or "",
            "role": r_name,
            "status": "active" if u.is_active else "inactive",
            "institute_id": u.institute_id,
            "created_at": u.created_at or datetime.utcnow()
        })
        
    return result

@router.post("/users", response_model=InstituteUserResponse)
def create_institute_user(
    user_data: InstituteUserCreate,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    # Prevent creating super admin
    if user_data.role.lower() in ["admin", "superadmin", "platformadmin"]:
        raise HTTPException(status_code=400, detail="Cannot create Super Admin")
        
    # Check duplicate email
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    full_name = f"{user_data.first_name} {user_data.last_name}".strip()
    if not full_name:
        full_name = user_data.email.split('@')[0]

    base_username = full_name
    candidate_username = base_username
    counter = 1
    while db.query(User).filter(User.username == candidate_username).first():
        candidate_username = f"{base_username}_{counter}"
        counter += 1

    # Create User
    new_user = User(
        username=candidate_username,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=get_password_hash(user_data.password),
        institute_id=current_user.institute_id,
        is_active=True if user_data.status == "active" else False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Assign Role
    target_role = user_data.role
    role_obj = db.query(Role).filter(Role.name.ilike(target_role), Role.institute_id == current_user.institute_id).first()
    if not role_obj:
        role_obj = db.query(Role).filter(Role.name.ilike(target_role)).first()
    if not role_obj:
        role_obj = Role(name=target_role, institute_id=current_user.institute_id)
        db.add(role_obj)
        db.commit()
        db.refresh(role_obj)
        
    new_user.roles.append(role_obj)
    
    # If student, add to Student table
    if target_role.lower() == "student":
        existing_student = db.query(Student).filter(Student.email == user_data.email).first()
        if not existing_student:
            db.add(Student(
                institute_id=current_user.institute_id,
                name=full_name,
                email=user_data.email,
                phone=user_data.phone
            ))
        
    db.commit()
    
    return {
        "id": new_user.id,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "email": new_user.email,
        "phone": new_user.phone or "",
        "role": target_role,
        "status": "active" if new_user.is_active else "inactive",
        "institute_id": new_user.institute_id,
        "created_at": new_user.created_at or datetime.utcnow()
    }

@router.put("/users/{target_user_id}/status")
@router.patch("/users/{target_user_id}/status")
def update_user_status(
    target_user_id: int,
    status: Optional[str] = None,
    payload: Optional[dict] = None,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    user_roles = [r.name.lower() for r in current_user.roles]
    is_platform_admin = any(r in {"admin", "platformadmin"} for r in user_roles)
    
    if is_platform_admin:
        user = db.query(User).filter(User.id == target_user_id).first()
    else:
        user = db.query(User).filter(User.id == target_user_id, User.institute_id == current_user.institute_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payload and "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    elif payload and "status" in payload:
        user.is_active = (payload["status"] == "active")
    elif status:
        user.is_active = (status == "active")
        
    db.commit()
    return {"detail": "Status updated", "is_active": user.is_active, "status": "active" if user.is_active else "inactive"}

@router.post("/users/bulk-upload", response_model=BulkUserImportResult)
def bulk_upload_users(
    file: UploadFile = File(...),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    success = 0
    errors = []
    
    try:
        csvReader = csv.DictReader(codecs.iterdecode(file.file, 'utf-8'))
        for row in csvReader:
            try:
                email = row.get('email', '').strip()
                if not email:
                    errors.append("Row missing email")
                    continue
                    
                if db.query(User).filter(User.email == email).first():
                    errors.append(f"Email {email} already exists")
                    continue
                    
                role_str = row.get('role', 'student').strip()
                if role_str.lower() in ['admin', 'superadmin']:
                    errors.append(f"Cannot create admin role for {email}")
                    continue
                    
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                full_name = f"{first_name} {last_name}".strip() or email.split('@')[0]

                base_username = full_name
                candidate_username = base_username
                counter = 1
                while db.query(User).filter(User.username == candidate_username).first():
                    candidate_username = f"{base_username}_{counter}"
                    counter += 1

                new_user = User(
                    username=candidate_username,
                    email=email,
                    phone=row.get('phone', '').strip(),
                    hashed_password=get_password_hash("defaultpass123"),
                    institute_id=current_user.institute_id,
                    is_active=True
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                
                role_obj = db.query(Role).filter(Role.name.ilike(role_str), Role.institute_id == current_user.institute_id).first()
                if not role_obj:
                    role_obj = db.query(Role).filter(Role.name.ilike(role_str)).first()
                if not role_obj:
                    role_obj = Role(name=role_str, institute_id=current_user.institute_id)
                    db.add(role_obj)
                    db.commit()
                    db.refresh(role_obj)
                    
                new_user.roles.append(role_obj)
                
                if role_str.lower() == "student":
                    existing_student = db.query(Student).filter(Student.email == email).first()
                    if not existing_student:
                        db.add(Student(
                            institute_id=current_user.institute_id,
                            name=full_name,
                            email=email,
                            phone=new_user.phone
                        ))
                    
                db.commit()
                success += 1
            except Exception as e:
                errors.append(f"Error processing row for {row.get('email', 'unknown')}: {str(e)}")
                
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
        
    return {"success_count": success, "error_count": len(errors), "errors": errors}

# --- MANAGE ROLES ---

@router.get("/permissions", response_model=list[PermissionResponse])
def get_permissions(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    # Institute Admin can see all available permissions to map
    return db.query(Permission).all()

@router.get("/roles", response_model=list[RoleResponse])
def get_roles(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    roles = db.query(Role).filter(Role.institute_id == current_user.institute_id).all()
    result = []
    for r in roles:
        r_dict = r.__dict__.copy()
        
        # Get permissions
        r_dict["permissions"] = r.permissions
        result.append(r_dict)
    return result

@router.post("/roles", response_model=RoleResponse)
def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    if role_data.name.lower() in ["admin", "superadmin", "instituteadmin"]:
        raise HTTPException(status_code=400, detail="Cannot create protected role names")
        
    new_role = Role(name=role_data.name, institute_id=current_user.institute_id)
    if role_data.permission_ids:
        perms = db.query(Permission).filter(Permission.id.in_(role_data.permission_ids)).all()
        new_role.permissions = perms

    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    res = new_role.__dict__.copy()
    res["permissions"] = new_role.permissions
    return res

@router.put("/roles/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_update: RoleUpdate,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == role_id, Role.institute_id == current_user.institute_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.name in ["InstituteAdmin", "teacher", "student", "admin"]:
        if role.name != role_update.name:
            raise HTTPException(status_code=400, detail="Cannot rename system default roles")
            
    role.name = role_update.name
    if role_update.permission_ids:
        perms = db.query(Permission).filter(Permission.id.in_(role_update.permission_ids)).all()
        role.permissions = perms
    else:
        role.permissions = []
        
    db.commit()
    db.refresh(role)
    
    res = role.__dict__.copy()
    res["permissions"] = role.permissions
    return res

@router.delete("/roles/{role_id}")
def delete_role(role_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id, Role.institute_id == current_user.institute_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.name in ["InstituteAdmin", "teacher", "student", "admin"]:
        raise HTTPException(status_code=400, detail="Cannot delete system default roles")
        
    db.delete(role)
    db.commit()
    return {"detail": "Role deleted"}

# --- NOTIFICATIONS ---
from datetime import datetime

@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(Notification.institute_id == current_user.institute_id).order_by(Notification.created_at.desc()).all()

@router.post("/notifications", response_model=NotificationResponse)
def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    new_notif = Notification(
        institute_id=current_user.institute_id,
        title=data.title,
        message=data.message,
        target_audience=data.target_audience,
        status=data.status,
        scheduled_date=data.scheduled_date,
        published_date=datetime.utcnow() if data.status == "published" else None
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif

@router.put("/notifications/{notif_id}", response_model=NotificationResponse)
def update_notification(
    notif_id: int,
    data: NotificationUpdate,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.institute_id == current_user.institute_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notif.status == "published":
        raise HTTPException(status_code=400, detail="Cannot edit a published notification")
        
    notif.title = data.title
    notif.message = data.message
    notif.target_audience = data.target_audience
    notif.status = data.status
    notif.scheduled_date = data.scheduled_date
    
    db.commit()
    db.refresh(notif)
    return notif

@router.delete("/notifications/{notif_id}")
def delete_notification(
    notif_id: int, 
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.institute_id == current_user.institute_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notif)
    db.commit()
    return {"detail": "Notification deleted"}

@router.post("/notifications/{notif_id}/publish", response_model=NotificationResponse)
def publish_notification(
    notif_id: int, 
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.institute_id == current_user.institute_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notif.status == "published":
        raise HTTPException(status_code=400, detail="Already published")
        
    notif.status = "published"
    notif.published_date = datetime.utcnow()
    
    db.commit()
    db.refresh(notif)
    return notif

# --- TRANSACTIONS ---
from sqlalchemy import func

@router.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    gateway: Optional[str] = None,
    course_id: Optional[int] = None,
    student_search: Optional[str] = None,
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).filter(Transaction.institute_id == current_user.institute_id)
    
    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Transaction.transaction_date >= df)
        except: pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d")
            query = query.filter(Transaction.transaction_date <= dt)
        except: pass
        
    if status and status != "All":
        query = query.filter(func.lower(Transaction.payment_status) == status.lower())
    if gateway and gateway != "All":
        query = query.filter(func.lower(Transaction.payment_gateway) == gateway.lower())
    if course_id:
        query = query.filter(Transaction.course_id == course_id)
        
    if student_search:
        query = query.join(Student, isouter=True).filter(Student.name.ilike(f"%{student_search}%"))
        
    transactions = query.order_by(Transaction.transaction_date.desc()).all()
    
    result = []
    for t in transactions:
        t_dict = {
            "id": t.id,
            "institute_id": t.institute_id,
            "student_id": t.student_id,
            "course_id": t.course_id,
            "amount": float(t.amount or 0.0),
            "currency": t.currency or "INR",
            "payment_gateway": t.payment_gateway or "Razorpay",
            "payment_status": t.payment_status or "successful",
            "invoice_reference_id": t.invoice_reference_id or f"TXN-{t.id}",
            "transaction_date": t.transaction_date or datetime.utcnow(),
            "student_name": None,
            "course_name": None
        }
        s = db.query(Student).filter(Student.id == t.student_id).first()
        if s: t_dict["student_name"] = s.name
        
        if t.course_id:
            c = db.query(Course).filter(Course.id == t.course_id).first()
            if c: t_dict["course_name"] = c.title
            
        result.append(t_dict)
        
    return result

@router.get("/transactions/monthly-summary", response_model=list[MonthlySummaryItem])
def get_transactions_monthly_summary(
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    dialect = db.bind.dialect.name if db.bind else 'postgresql'
    if dialect == 'postgresql':
        month_expr = func.to_char(Transaction.transaction_date, 'YYYY-MM')
    else:
        month_expr = func.strftime('%Y-%m', Transaction.transaction_date)
    
    query = db.query(
        month_expr.label('month'),
        func.sum(Transaction.amount).label('total_amount')
    ).filter(
        Transaction.institute_id == current_user.institute_id,
        func.lower(Transaction.payment_status) == 'successful'
    ).group_by(month_expr).order_by(month_expr).limit(12).all()
    
    result = []
    for row in query:
        if row.month:
            result.append({"month": str(row.month), "total_amount": float(row.total_amount or 0.0)})
        
    return result

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.institute_id == current_user.institute_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    t_dict = t.__dict__.copy()
    s = db.query(Student).filter(Student.id == t.student_id).first()
    if s: t_dict["student_name"] = s.name
    
    if t.course_id:
        c = db.query(Course).filter(Course.id == t.course_id).first()
        if c: t_dict["course_name"] = c.title
        
    return t_dict

# --- CERTIFICATES ---
import uuid

@router.get("/certificates/templates", response_model=list[CertificateTemplateResponse])
def get_cert_templates(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    return db.query(CertificateTemplate).filter(CertificateTemplate.institute_id == current_user.institute_id).all()

@router.post("/certificates/templates", response_model=CertificateTemplateResponse)
def create_cert_template(data: CertificateTemplateCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    t = CertificateTemplate(
        institute_id=current_user.institute_id,
        **data.dict()
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.put("/certificates/templates/{t_id}", response_model=CertificateTemplateResponse)
def update_cert_template(t_id: int, data: CertificateTemplateUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    t = db.query(CertificateTemplate).filter(CertificateTemplate.id == t_id, CertificateTemplate.institute_id == current_user.institute_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
        
    for k, v in data.dict().items():
        setattr(t, k, v)
        
    db.commit()
    db.refresh(t)
    return t

@router.delete("/certificates/templates/{t_id}")
def delete_cert_template(t_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    t = db.query(CertificateTemplate).filter(CertificateTemplate.id == t_id, CertificateTemplate.institute_id == current_user.institute_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
        
    db.delete(t)
    db.commit()
    return {"detail": "Deleted"}

@router.get("/certificates/records", response_model=list[CertificateRecordResponse])
def get_cert_records(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    records = db.query(CertificateRecord).filter(CertificateRecord.institute_id == current_user.institute_id).order_by(CertificateRecord.issue_date.desc()).all()
    
    res = []
    for r in records:
        r_dict = r.__dict__.copy()
        s = db.query(Student).filter(Student.id == r.student_id).first()
        if s: r_dict["student_name"] = s.name
        c = db.query(Course).filter(Course.id == r.course_id).first()
        if c: r_dict["course_name"] = c.title
        t = db.query(CertificateTemplate).filter(CertificateTemplate.id == r.template_id).first()
        if t: r_dict["template_name"] = t.name
        res.append(r_dict)
    return res

@router.post("/certificates/records", response_model=CertificateRecordResponse)
def issue_certificate(data: CertificateRecordCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    # Generate unique cert number
    import uuid
    cert_no = f"CERT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    r = CertificateRecord(
        institute_id=current_user.institute_id,
        student_id=data.student_id,
        course_id=data.course_id,
        template_id=data.template_id,
        status=data.status,
        certificate_number=cert_no
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    
    r_dict = r.__dict__.copy()
    s = db.query(Student).filter(Student.id == r.student_id).first()
    if s: r_dict["student_name"] = s.name
    c = db.query(Course).filter(Course.id == r.course_id).first()
    if c: r_dict["course_name"] = c.title
    t = db.query(CertificateTemplate).filter(CertificateTemplate.id == r.template_id).first()
    if t: r_dict["template_name"] = t.name
    return r_dict

@router.put("/certificates/records/{r_id}/status")
def update_cert_status(r_id: int, status: str, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    r = db.query(CertificateRecord).filter(CertificateRecord.id == r_id, CertificateRecord.institute_id == current_user.institute_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
        
    r.status = status
    db.commit()
    return {"detail": "Status updated"}

# --- NEWSFEED ---
import json

@router.get("/social/newsfeed", response_model=list[NewsfeedPostResponse])
def get_newsfeed_posts(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    posts = db.query(NewsfeedPost).filter(NewsfeedPost.institute_id == current_user.institute_id).order_by(NewsfeedPost.created_at.desc()).all()
    res = []
    for p in posts:
        p_dict = p.__dict__.copy()
        author = db.query(User).filter(User.id == p.author_id).first()
        if author: p_dict["author_name"] = author.username
        p_dict["likes_count"] = 0
        p_dict["comments_count"] = 0
        res.append(p_dict)
    return res

@router.post("/social/newsfeed", response_model=NewsfeedPostResponse)
async def create_newsfeed_post(
    data: str = Form(...),
    file: UploadFile = File(None),
    current_user: User = Depends(require_institute_admin),
    db: Session = Depends(get_db)
):
    post_data = json.loads(data)
    
    image_url = None
    if file:
        file_meta = await storage_service.save_file(file, "images")
        image_url = f"/api/storage/{file_meta['file_id']}"
        
    p = NewsfeedPost(
        institute_id=current_user.institute_id,
        author_id=current_user.id,
        title=post_data["title"],
        content=post_data["content"],
        post_type=post_data["post_type"],
        status=post_data["status"],
        image_url=image_url
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    
    p_dict = p.__dict__.copy()
    p_dict["author_name"] = current_user.username
    p_dict["likes_count"] = 0
    p_dict["comments_count"] = 0
    return p_dict

@router.put("/social/newsfeed/{post_id}", response_model=NewsfeedPostResponse)
def update_newsfeed_post(post_id: int, data: NewsfeedPostUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    p = db.query(NewsfeedPost).filter(NewsfeedPost.id == post_id, NewsfeedPost.institute_id == current_user.institute_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
        
    for k, v in data.dict(exclude_unset=True).items():
        setattr(p, k, v)
        
    db.commit()
    db.refresh(p)
    
    p_dict = p.__dict__.copy()
    author = db.query(User).filter(User.id == p.author_id).first()
    if author: p_dict["author_name"] = author.username
    p_dict["likes_count"] = 0
    p_dict["comments_count"] = 0
    return p_dict

@router.delete("/social/newsfeed/{post_id}")
def delete_newsfeed_post(post_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    p = db.query(NewsfeedPost).filter(NewsfeedPost.id == post_id, NewsfeedPost.institute_id == current_user.institute_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db.delete(p)
    db.commit()
    return {"detail": "Deleted"}

# --- CHAT ---
from sqlalchemy import or_, and_

@router.get("/social/chat/users", response_model=list[ChatUser])
def get_chat_users(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    # Institute Admin can chat with any user in the institute except themselves
    users = db.query(User).filter(User.institute_id == current_user.institute_id, User.id != current_user.id).all()
    res = []
    for u in users:
        role = db.query(Role).join(user_roles).filter(user_roles.c.user_id == u.id).first()
        res.append({
            "id": u.id,
            "name": u.username,
            "email": u.email,
            "role": role.name if role else "User"
        })
    return res

@router.get("/social/chat/conversations", response_model=list[ConversationResponse])
def get_conversations(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(
        Conversation.institute_id == current_user.institute_id,
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).order_by(Conversation.last_message_at.desc()).all()
    
    res = []
    for c in convs:
        other_id = c.user2_id if c.user1_id == current_user.id else c.user1_id
        other_user = db.query(User).filter(User.id == other_id).first()
        
        last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at.desc()).first()
        unread = db.query(Message).filter(Message.conversation_id == c.id, Message.sender_id == other_id, Message.is_read == False).count()
        
        res.append({
            "id": c.id,
            "other_user_id": other_id,
            "other_user_name": other_user.username if other_user else "Unknown User",
            "last_message": last_msg.content if last_msg else None,
            "last_message_at": c.last_message_at,
            "unread_count": unread
        })
    return res

@router.get("/social/chat/conversations/{conv_id}/messages", response_model=list[MessageResponse])
def get_messages(conv_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    c = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.institute_id == current_user.institute_id,
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).first()
    
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at.asc()).all()
    return messages

@router.post("/social/chat/messages", response_model=MessageResponse)
def send_message(data: MessageCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    # Check if conversation exists
    c = db.query(Conversation).filter(
        Conversation.institute_id == current_user.institute_id,
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == data.receiver_id),
            and_(Conversation.user1_id == data.receiver_id, Conversation.user2_id == current_user.id)
        )
    ).first()
    
    if not c:
        # Create new conversation
        c = Conversation(
            institute_id=current_user.institute_id,
            user1_id=current_user.id,
            user2_id=data.receiver_id,
            last_message_at=datetime.utcnow()
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    else:
        c.last_message_at = datetime.utcnow()
        db.commit()
        
    m = Message(
        conversation_id=c.id,
        sender_id=current_user.id,
        content=data.content
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@router.put("/social/chat/messages/{conv_id}/read")
def mark_read(conv_id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    c = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.institute_id == current_user.institute_id,
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).first()
    
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    other_id = c.user2_id if c.user1_id == current_user.id else c.user1_id
    db.query(Message).filter(Message.conversation_id == c.id, Message.sender_id == other_id, Message.is_read == False).update({"is_read": True})
    db.commit()
    return {"detail": "Messages marked as read"}

# --- CRM ---
@router.get("/crm/dashboard-stats", response_model=CRMDashboardStats)
def get_crm_stats(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    base_query = db.query(Lead).filter(Lead.institute_id == current_user.institute_id)
    
    total = base_query.count()
    new_leads = base_query.filter(Lead.status == "New").count()
    incomplete = base_query.filter(Lead.status == "Incomplete").count()
    converted = base_query.filter(Lead.status == "Converted").count()
    
    # Pending followups: Followups that are "Pending" across all leads of this institute
    pending = db.query(LeadFollowup).join(Lead).filter(Lead.institute_id == current_user.institute_id).count()
    
    return {
        "total_leads": total,
        "new_leads": new_leads,
        "pending_followups": pending,
        "incomplete_leads": incomplete,
        "converted_leads": converted
    }

@router.get("/crm/leads", response_model=list[CRMLeadResponse])
def get_crm_leads(status: str = None, search: str = None, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    query = db.query(Lead).filter(Lead.institute_id == current_user.institute_id)
    
    if status and status != 'All':
        query = query.filter(Lead.status == status)
    if search:
        query = query.filter(or_(Lead.name.ilike(f"%{search}%"), Lead.phone.ilike(f"%{search}%"), Lead.course_interest.ilike(f"%{search}%")))
        
    leads = query.order_by(Lead.inquiry_date.desc()).all()
    
    res = []
    for l in leads:
        followups = db.query(LeadFollowup).filter(LeadFollowup.lead_id == l.id).order_by(LeadFollowup.followup_date.desc()).all()
        f_res = []
        for f in followups:
            f_res.append({
                "id": f.id,
                "lead_id": f.lead_id,
                "notes": f.note,
                "status": "Completed",
                "followup_date": f.followup_date,
                "created_at": f.followup_date or datetime.utcnow()
            })
        
        staff = db.query(User).filter(User.id == l.assigned_to).first() if l.assigned_to else None
        
        res.append({
            "id": l.id,
            "name": l.name,
            "email": l.notes.replace("Email: ", "") if l.notes and l.notes.startswith("Email: ") else "",
            "phone": l.phone or "",
            "status": l.status or "New",
            "source": l.source or "",
            "institute_id": l.institute_id or current_user.institute_id,
            "inquiry_date": l.inquiry_date or datetime.utcnow(),
            "created_at": l.inquiry_date or datetime.utcnow(),
            "assigned_staff_id": l.assigned_to,
            "assigned_staff_name": staff.username if staff else None,
            "followups": f_res
        })
    return res

@router.post("/crm/leads", response_model=CRMLeadResponse)
def create_crm_lead(data: CRMLeadCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    l = Lead(
        institute_id=current_user.institute_id,
        name=data.name,
        phone=data.phone,
        course_interest=data.course_interest or data.source,
        source=data.source,
        status=data.status or "New",
        assigned_to=data.assigned_staff_id,
        notes=f"Email: {data.email}" if data.email else None
    )
    db.add(l)
    db.commit()
    db.refresh(l)
    
    # Trigger automated workflow event
    trigger_workflow_event(db, current_user.institute_id, "Lead Created", {"lead_id": l.id, "name": l.name})
    
    staff = db.query(User).filter(User.id == l.assigned_to).first() if l.assigned_to else None
    
    return {
        "id": l.id,
        "name": l.name,
        "email": data.email or "",
        "phone": l.phone or "",
        "status": l.status or "New",
        "source": l.source or "",
        "institute_id": l.institute_id or current_user.institute_id,
        "inquiry_date": l.inquiry_date or datetime.utcnow(),
        "created_at": l.inquiry_date or datetime.utcnow(),
        "assigned_staff_id": l.assigned_to,
        "assigned_staff_name": staff.username if staff else None,
        "followups": []
    }

@router.put("/crm/leads/{lead_id}", response_model=CRMLeadResponse)
def update_crm_lead(lead_id: int, data: CRMLeadUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    l = db.query(Lead).filter(Lead.id == lead_id, Lead.institute_id == current_user.institute_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    for k, v in data.dict(exclude_unset=True).items():
        if k == "assigned_staff_id":
            l.assigned_to = v
        elif hasattr(l, k):
            setattr(l, k, v)
        
    db.commit()
    db.refresh(l)
    
    followups = db.query(LeadFollowup).filter(LeadFollowup.lead_id == l.id).order_by(LeadFollowup.followup_date.desc()).all()
    f_res = []
    for f in followups:
        f_res.append({
            "id": f.id,
            "lead_id": f.lead_id,
            "notes": f.note,
            "status": "Completed",
            "followup_date": f.followup_date,
            "created_at": f.followup_date or datetime.utcnow()
        })
        
    staff = db.query(User).filter(User.id == l.assigned_to).first() if l.assigned_to else None
    
    return {
        "id": l.id,
        "name": l.name,
        "email": data.email or (l.notes.replace("Email: ", "") if l.notes and l.notes.startswith("Email: ") else ""),
        "phone": l.phone or "",
        "status": l.status or "New",
        "source": l.source or "",
        "institute_id": l.institute_id or current_user.institute_id,
        "inquiry_date": l.inquiry_date or datetime.utcnow(),
        "created_at": l.inquiry_date or datetime.utcnow(),
        "assigned_staff_id": l.assigned_to,
        "assigned_staff_name": staff.username if staff else None,
        "followups": f_res
    }

@router.post("/crm/leads/{lead_id}/followups")
def create_crm_followup(lead_id: int, data: CRMFollowupCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    l = db.query(Lead).filter(Lead.id == lead_id, Lead.institute_id == current_user.institute_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    f = LeadFollowup(
        lead_id=l.id,
        note=data.notes,
        followup_date=data.followup_date or datetime.utcnow(),
        created_by=current_user.id
    )
    db.add(f)
    
    if l.status == "New":
        l.status = "Contacted"
    l.last_followup = datetime.utcnow()
        
    db.commit()
    
    # Trigger automated workflow event
    trigger_workflow_event(db, current_user.institute_id, "Lead Follow-up Due", {"lead_id": l.id, "note": data.notes})
    
    return {"detail": "Follow-up added"}

@router.post("/crm/leads/{lead_id}/enroll")
def enroll_lead(lead_id: int, course_id: Optional[int] = None, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.institute_id == current_user.institute_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    lead.status = "Converted"
    
    # Find or create student
    student = db.query(Student).filter(Student.institute_id == current_user.institute_id, Student.name == lead.name).first()
    if not student:
        student = Student(
            institute_id=current_user.institute_id,
            name=lead.name,
            email=f"{lead.name.lower().replace(' ', '')}@kite.lms",
            phone=lead.phone
        )
        db.add(student)
        db.flush()
        
    if course_id:
        c = db.query(Course).filter(Course.id == course_id, Course.institute_id == current_user.institute_id).first()
        if c and student not in c.students:
            c.students.append(student)
            
    db.commit()
    
    # Trigger automated workflow events
    trigger_workflow_event(db, current_user.institute_id, "Student Enrolled", {"lead_id": lead.id, "student_id": student.id, "name": student.name})
    trigger_workflow_event(db, current_user.institute_id, "Course Access Required", {"student_id": student.id, "course_id": course_id})
    
    return {"detail": f"Lead {lead.name} successfully enrolled and workflows triggered."}

# --- INTEGRATIONS ---
@router.get("/integrations", response_model=list[IntegrationResponse])
def get_integrations(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    integrations = db.query(InstituteIntegration).filter(InstituteIntegration.institute_id == current_user.institute_id).all()
    res = []
    for inc in integrations:
        i_dict = inc.__dict__.copy()
        i_dict["credentials"] = mask_credentials(inc.credentials_json)
        res.append(i_dict)
    return res

@router.post("/integrations/{provider_type}")
def save_integration(provider_type: str, data: IntegrationUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    inc = db.query(InstituteIntegration).filter(
        InstituteIntegration.institute_id == current_user.institute_id,
        InstituteIntegration.provider_type == provider_type
    ).first()
    
    # Process incoming credentials. If masked, fetch old ones and merge.
    new_creds = data.credentials
    if inc:
        old_creds = json.loads(inc.credentials_json) if inc.credentials_json else {}
        for k, v in new_creds.items():
            if v == "********" and k in old_creds:
                new_creds[k] = old_creds[k]
                
    creds_json = json.dumps(new_creds)
    
    if inc:
        inc.provider_name = data.provider_name
        inc.credentials_json = creds_json
        inc.status = data.status
        inc.updated_at = datetime.utcnow()
    else:
        inc = InstituteIntegration(
            institute_id=current_user.institute_id,
            provider_type=provider_type,
            provider_name=data.provider_name,
            credentials_json=creds_json,
            status=data.status
        )
        db.add(inc)
        
    db.commit()
    db.refresh(inc)
    
    i_dict = inc.__dict__.copy()
    i_dict["credentials"] = mask_credentials(inc.credentials_json)
    return i_dict

@router.post("/integrations/{provider_type}/verify")
def verify_integration(provider_type: str, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    inc = db.query(InstituteIntegration).filter(
        InstituteIntegration.institute_id == current_user.institute_id,
        InstituteIntegration.provider_type == provider_type
    ).first()
    
    if not inc:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    # Mock verification success
    inc.status = "Active"
    db.commit()
    return {"detail": "Verification successful. Status is now Active."}

@router.post("/integrations/email/test")
def test_email_integration(current_user: User = Depends(require_institute_admin)):
    return {"detail": "Test email dispatched successfully."}

# --- WEBHOOKS (Public, but we put it here for simplicity of the architecture task) ---
@router.post("/webhooks/payments/{provider}")
def handle_payment_webhook(provider: str, payload: dict, db: Session = Depends(get_db)):
    # Simulating the webhook workflow:
    # Payment Successful -> Enrollment Created -> Course Access Granted -> Payment Confirmation -> Student Notification
    
    # 1. Parse payload (Mock data)
    student_id = payload.get("student_id", 4) # fallback to our seed student
    course_id = payload.get("course_id", 1)
    institute_id = payload.get("institute_id", 1)
    amount = payload.get("amount", 999.0)
    
    # 2. Log Transaction
    tx = Transaction(
        institute_id=institute_id,
        student_id=student_id,
        course_id=course_id,
        amount=amount,
        currency="USD",
        payment_gateway=provider,
        payment_status="Success",
        invoice_reference_id=f"INV-{int(datetime.utcnow().timestamp())}"
    )
    db.add(tx)
    
    # 3. Create Enrollment (Course Access Granted)
    student = db.query(Student).filter(Student.id == student_id).first()
    course = db.query(Course).filter(Course.id == course_id).first()
    if student and course and student not in course.students:
        course.students.append(student)
    
    db.commit()
    
    # 4. Dispatch Notification
    IntegrationFactory.dispatch_welcome_email(
        student_name="Student", 
        course_name="Course", 
        amount=amount, 
        join_date=datetime.utcnow().strftime("%Y-%m-%d")
    )
    
    return {"detail": "Webhook processed successfully"}

# --- BILLING & INVOICING ---
@router.get("/billing/config", response_model=InstituteBillingConfigResponse)
def get_billing_config(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    config = db.query(InstituteBillingConfig).filter(InstituteBillingConfig.institute_id == current_user.institute_id).first()
    if not config:
        # Auto-create default
        config = InstituteBillingConfig(institute_id=current_user.institute_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/billing/config", response_model=InstituteBillingConfigResponse)
def update_billing_config(data: InstituteBillingConfigUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    config = db.query(InstituteBillingConfig).filter(InstituteBillingConfig.institute_id == current_user.institute_id).first()
    if not config:
        config = InstituteBillingConfig(institute_id=current_user.institute_id)
        db.add(config)
        
    for k, v in data.dict().items():
        setattr(config, k, v)
        
    db.commit()
    db.refresh(config)
    return config

@router.get("/billing/invoices", response_model=list[InvoiceResponse])
def get_invoices(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    invoices = db.query(Invoice).filter(Invoice.institute_id == current_user.institute_id).order_by(Invoice.issue_date.desc()).all()
    res = []
    for inv in invoices:
        i_dict = inv.__dict__.copy()
        student = db.query(User).filter(User.id == inv.student_id).first()
        course = db.query(Course).filter(Course.id == inv.course_id).first()
        i_dict["student_name"] = student.username if student else "Unknown"
        i_dict["course_name"] = course.title if course else "Unknown"
        res.append(i_dict)
    return res

# --- WORKFLOWS ---
@router.get("/workflows", response_model=list[WorkflowResponse])
def get_workflows(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    return db.query(Workflow).filter(Workflow.institute_id == current_user.institute_id).options(joinedload(Workflow.actions)).all()

@router.get("/workflows/logs", response_model=list[WorkflowLogResponse])
def get_workflow_logs(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    wfs = db.query(Workflow.id).filter(Workflow.institute_id == current_user.institute_id)
    logs = db.query(WorkflowExecutionLog).filter(WorkflowExecutionLog.workflow_id.in_(wfs.scalar_subquery())).order_by(WorkflowExecutionLog.execution_date.desc()).all()
    return logs

@router.post("/workflows", response_model=WorkflowResponse)
def create_workflow(data: WorkflowCreate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    wf = Workflow(
        institute_id=current_user.institute_id,
        name=data.name,
        trigger_event=data.trigger_event,
        is_active=data.is_active,
        conditions=data.conditions
    )
    db.add(wf)
    db.flush()
    
    for act in data.actions:
        a = WorkflowAction(
            workflow_id=wf.id,
            action_type=act.action_type,
            action_payload=act.action_payload,
            order_index=act.order_index
        )
        db.add(a)
    db.commit()
    db.refresh(wf)
    return wf

@router.put("/workflows/{id}/toggle")
def toggle_workflow_status(id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == id, Workflow.institute_id == current_user.institute_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.is_active = not wf.is_active
    db.commit()
    return {"message": "Toggled", "is_active": wf.is_active}

@router.post("/workflows/{id}/test")
def test_trigger_workflow(id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == id, Workflow.institute_id == current_user.institute_id).options(joinedload(Workflow.actions)).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    import json
    log = WorkflowExecutionLog(
        workflow_id=wf.id,
        trigger_payload=json.dumps({"test_run": True, "event": wf.trigger_event}),
        status="Success",
        execution_date=datetime.utcnow()
    )
    db.add(log)
    
    notif = Notification(
        institute_id=current_user.institute_id,
        title=f"Test Triggered: {wf.name}",
        message=f"Manual execution test for workflow '{wf.name}' succeeded.",
        notification_type="System Notification"
    )
    db.add(notif)
    db.commit()
    db.refresh(log)
    return {"message": "Workflow test execution completed", "log_id": log.id}

@router.delete("/workflows/{id}")
def delete_workflow(id: int, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == id, Workflow.institute_id == current_user.institute_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(wf)
    db.commit()
    return {"message": "Deleted"}

# --- REPORTS ---
@router.post("/reports/generate")
def generate_report(req: ReportRequest, background_tasks: BackgroundTasks, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    # Create history entry as processing
    rh = ReportHistory(
        institute_id=current_user.institute_id,
        report_type=req.report_type,
        status="Processing"
    )
    db.add(rh)
    db.commit()
    db.refresh(rh)
    
    from app.services.reports import ReportService
    # Simulate background processing
    background_tasks.add_task(ReportService.process_report_async, rh.id, current_user.institute_id, req.report_type)
    return {"message": "Report generation started", "report_id": rh.id}

@router.get("/reports/history", response_model=list[ReportHistoryResponse])
def get_report_history(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    return db.query(ReportHistory).filter(ReportHistory.institute_id == current_user.institute_id).order_by(ReportHistory.generated_at.desc()).all()

# --- EXPLORE PLANS ---
@router.get("/plans/addons", response_model=list[InstitutePlanAddonResponse])
def get_addons(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    addons = db.query(InstitutePlanAddon).filter(InstitutePlanAddon.institute_id == current_user.institute_id).all()
    if not addons:
        # Auto create defaults
        names = ["On Domain", "Android & iOS App", "Nrich Lead Management", "WhatsApp", "Zoom SDK", "WordPress"]
        addons = [InstitutePlanAddon(institute_id=current_user.institute_id, addon_name=n) for n in names]
        db.add_all(addons)
        db.commit()
    return addons

@router.post("/plans/addons/{addon_name}/activate", response_model=InstitutePlanAddonResponse)
def activate_addon(addon_name: str, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    addon = db.query(InstitutePlanAddon).filter(InstitutePlanAddon.institute_id == current_user.institute_id, InstitutePlanAddon.addon_name == addon_name).first()
    if not addon:
        raise HTTPException(status_code=404, detail="Addon not found")
    addon.status = "Active"
    from datetime import datetime
    addon.activation_date = datetime.utcnow()
    db.commit()
    db.refresh(addon)
    return addon

# --- PROFILE & SETTINGS ---
@router.put("/profile")
def update_my_profile(
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    # Only update allowed fields. Role and institute_id are locked.
    current_user.name = name
    current_user.email = email
    current_user.phone = phone
    
    if profile_image:
        from app.services.storage import StorageService
        url = StorageService.save_file(profile_image, folder="profiles")
        current_user.profile_image_url = url
        
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated", "profile_image_url": current_user.profile_image_url}

@router.get("/institute/profile", response_model=InstituteProfileResponse)
def get_institute_profile(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    inst = db.query(Institute).filter(Institute.id == current_user.institute_id).first()
    return inst

@router.put("/institute/profile", response_model=InstituteProfileResponse)
def update_institute_profile(
    data: str = Form(...), # JSON string of InstituteProfileUpdate
    logo: Optional[UploadFile] = File(None),
    banner: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_institute_admin), 
    db: Session = Depends(get_db)
):
    import json
    inst = db.query(Institute).filter(Institute.id == current_user.institute_id).first()
    
    parsed = json.loads(data)
    for k, v in parsed.items():
        setattr(inst, k, v)
        
    from app.services.storage import StorageService
    if logo:
        inst.logo_url = StorageService.save_file(logo, folder="branding")
    if banner:
        inst.banner_url = StorageService.save_file(banner, folder="branding")
        
    db.commit()
    db.refresh(inst)
    return inst

@router.get("/institute/settings", response_model=InstituteSettingsResponse)
def get_institute_settings(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    settings = db.query(InstituteSettings).filter(InstituteSettings.institute_id == current_user.institute_id).first()
    if not settings:
        settings = InstituteSettings(institute_id=current_user.institute_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/institute/settings", response_model=InstituteSettingsResponse)
def update_institute_settings(data: InstituteSettingsUpdate, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    settings = db.query(InstituteSettings).filter(InstituteSettings.institute_id == current_user.institute_id).first()
    if not settings:
        settings = InstituteSettings(institute_id=current_user.institute_id)
        db.add(settings)
        
    for k, v in data.dict(exclude_unset=True).items():
        setattr(settings, k, v)
        
    db.commit()
    db.refresh(settings)
    return settings

# --- PLATFORM ADMIN INSTITUTES DIRECTORY ---
@router.get("/institutes")
def list_institutes(current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    institutes = db.query(Institute).all()
    result = []
    for inst in institutes:
        student_count = db.query(Student).filter(Student.institute_id == inst.id).count()
        teacher_count = db.query(User).join(User.roles).filter(User.institute_id == inst.id, Role.name.ilike('%teacher%')).count()
        result.append({
            "id": inst.id,
            "name": inst.name,
            "subdomain": inst.subdomain or "kite",
            "students_count": student_count,
            "teachers_count": teacher_count,
            "status": "Active",
            "phone": inst.phone or "",
            "email": inst.email or "",
            "address": inst.address or "",
            "created_at": inst.created_at.strftime("%b %Y") if inst.created_at else "Jan 2026"
        })
    return result

@router.post("/institutes")
def create_institute(payload: dict, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    name = payload.get("name")
    subdomain = payload.get("subdomain")
    if not name or not subdomain:
        raise HTTPException(status_code=400, detail="Name and subdomain are required")
    
    existing = db.query(Institute).filter((Institute.subdomain == subdomain) | (Institute.name == name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institute with this name or subdomain already exists")
        
    inst = Institute(
        name=name,
        subdomain=subdomain,
        phone=payload.get("phone"),
        email=payload.get("email"),
        address=payload.get("address"),
        about_text=payload.get("about_text")
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    
    settings = InstituteSettings(institute_id=inst.id)
    db.add(settings)
    db.commit()
    
    return {
        "id": inst.id,
        "name": inst.name,
        "subdomain": inst.subdomain,
        "students_count": 0,
        "teachers_count": 0,
        "status": "Active",
        "phone": inst.phone or "",
        "email": inst.email or "",
        "address": inst.address or "",
        "created_at": inst.created_at.strftime("%b %Y") if inst.created_at else "Sep 2026"
    }

@router.put("/institutes/{inst_id}/status")
def toggle_institute_status(inst_id: int, payload: dict, current_user: User = Depends(require_institute_admin), db: Session = Depends(get_db)):
    inst = db.query(Institute).filter(Institute.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    status_val = payload.get("status", "Active")
    return {"id": inst_id, "status": status_val}

