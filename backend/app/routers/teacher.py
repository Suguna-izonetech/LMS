import os
from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.models.all_models import (
    User, Role, Permission, Course, Batch, Student, LiveClass, 
    LiveClassAttendance, Book, StudyMaterial, Quiz, QuizQuestion, 
    QuizOption, QuizAttempt, QuizAnswer, Task, TaskAttachment, 
    TaskSubmission, Webinar, Lead, LeadFollowup, NewsfeedPost, 
    ChatConversation, ChatParticipant, ChatMessage, Notification, 
    UserNotification, CourseActivity
)
from app.core.dependencies import get_current_user, require_role, require_permission
from app.core.security import get_password_hash, verify_password
from app.services.report_service import generate_excel_report

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- PYDANTIC SCHEMAS ---

class CourseCreate(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    course_type: str = "Online"
    visibility: str = "Public"
    status: str = "Published"
    batches: Optional[List[str]] = None

class LiveClassCreate(BaseModel):
    course_id: int
    batch_id: int
    title: str
    description: Optional[str] = None
    scheduled_date: datetime
    meeting_link: Optional[str] = None
    live_class_url: Optional[str] = None
    youtube_live_url: Optional[str] = None

class LiveClassUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None
    recording_url: Optional[str] = None

class BookCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    file_url: str
    course_ids: List[int]

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    status: Optional[str] = None
    course_ids: Optional[List[int]] = None

class StudyMaterialCreate(BaseModel):
    title: str
    description: Optional[str] = None
    file_url: str
    course_id: int
    batch_id: Optional[int] = None
    material_type: str # Slides, Notes, Video, Syllabus
    visibility: str # public, private
    status: str # draft, published

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    batch_id: Optional[int] = None
    duration_minutes: int
    total_marks: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class QuizOptionCreate(BaseModel):
    option_text: str
    is_correct: bool

class QuizQuestionCreate(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    marks: int = 5
    options: List[QuizOptionCreate]

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    batch_id: Optional[int] = None
    deadline: datetime
    attachment_urls: Optional[List[str]] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class SubmissionGrade(BaseModel):
    grade: str
    feedback: Optional[str] = None

class WebinarCreate(BaseModel):
    title: str
    description: Optional[str] = None
    speaker_name: str
    course_id: int
    scheduled_date: datetime
    meeting_url: Optional[str] = None

class FollowupCreate(BaseModel):
    note: str

class NewsfeedPostCreate(BaseModel):
    title: Optional[str] = None
    content: str
    type: str = "general" # general, announcement, educational
    file_url: Optional[str] = None

class MessageSend(BaseModel):
    message_text: str

class ProfileUpdate(BaseModel):
    username: str
    email: EmailStr
    phone: Optional[str] = None

class PasswordUpdate(BaseModel):
    new_password: str
    current_password: Optional[str] = None

# --- SECURITY UTILS ---

def verify_course_ownership(db: Session, user_id: int, course_id: int):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user_roles = [r.name.lower() for r in user.roles]
        if any(r in {"admin", "platformadmin", "superadmin", "instituteadmin", "student"} for r in user_roles):
            return course
    if user_id not in [t.id for t in course.teachers]:
        raise HTTPException(status_code=403, detail="Access Denied: You are not assigned to this course")
    return course

# --- ENDPOINTS ---

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("teacher"))
):
    clean_filename = "".join(c for c in file.filename if c.isalnum() or c in "._- ")
    file_path = os.path.join(UPLOAD_DIR, clean_filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return {"file_url": f"/uploads/{clean_filename}"}

@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    total_courses = len(assigned_courses)
    
    # Unique students across assigned courses
    total_students = db.query(Student).join(Student.courses).filter(Course.id.in_(assigned_course_ids)).distinct().count() if assigned_course_ids else 0
    
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    today_classes = db.query(LiveClass).filter(
        LiveClass.course_id.in_(assigned_course_ids),
        LiveClass.scheduled_date >= today_start,
        LiveClass.scheduled_date <= today_end
    ).all()
    
    upcoming_classes = db.query(LiveClass).filter(
        LiveClass.course_id.in_(assigned_course_ids),
        LiveClass.scheduled_date > today_end,
        LiveClass.status == "upcoming"
    ).all()
    
    # Calculate attendance average
    attendance_records = db.query(LiveClassAttendance).join(LiveClassAttendance.live_class).filter(
        LiveClass.course_id.in_(assigned_course_ids)
    ).all()
    
    attendance_pct = 100.0
    if attendance_records:
        present_count = sum(1 for r in attendance_records if r.status == "present")
        attendance_pct = (present_count / len(attendance_records)) * 100.0
        
    pending_tasks = db.query(TaskSubmission).join(TaskSubmission.task).filter(
        Task.course_id.in_(assigned_course_ids),
        TaskSubmission.status == "pending"
    ).count()
    
    active_quizzes = db.query(Quiz).filter(
        Quiz.course_id.in_(assigned_course_ids),
        Quiz.status == "published"
    ).count()
    
    recent_notifications = db.query(UserNotification).options(
        joinedload(UserNotification.notification)
    ).filter(
        UserNotification.user_id == current_user.id
    ).order_by(UserNotification.is_read.asc(), UserNotification.id.desc()).limit(5).all()
    
    recent_activities = db.query(CourseActivity).filter(
        CourseActivity.course_id.in_(assigned_course_ids)
    ).order_by(CourseActivity.timestamp.desc()).limit(8).all()
    
    return {
        "total_assigned_courses": total_courses,
        "total_students": total_students,
        "assigned_courses": [
            {
                "id": c.id,
                "title": c.title,
                "code": c.code,
                "description": c.description,
                "course_type": c.course_type,
                "visibility": c.visibility,
                "status": c.status,
                "duration": c.duration or "Self-paced",
                "start_date": c.start_date.isoformat() if c.start_date else None,
                "thumbnail_url": c.thumbnail_url,
                "active_batches_count": db.query(Batch).filter(Batch.course_id == c.id, Batch.status == "Active").count(),
                "student_count": db.query(Student).join(Student.courses).filter(Course.id == c.id).count()
            }
            for c in assigned_courses
        ],
        "today_classes": [
            {"id": c.id, "title": c.title, "time": c.scheduled_date.strftime("%I:%M %p"), "status": c.status, "url": c.meeting_link}
            for c in today_classes
        ],
        "upcoming_classes_count": len(upcoming_classes),
        "attendance_percentage": round(attendance_pct, 1),
        "pending_tasks_count": pending_tasks,
        "active_quizzes_count": active_quizzes,
        "recent_notifications": [
            {
                "id": n.notification.id,
                "title": n.notification.title,
                "message": n.notification.message,
                "type": n.notification.notification_type,
                "redirect_url": n.notification.redirect_url,
                "is_read": n.is_read,
                "created_at": n.notification.created_at.isoformat()
            }
            for n in recent_notifications
        ],
        "recent_student_activities": [
            {
                "id": a.id,
                "student_name": a.student_name,
                "action": a.action,
                "detail": a.detail,
                "timestamp": a.timestamp.isoformat()
            }
            for a in recent_activities
        ]
    }

@router.get("/courses")
def get_courses(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    result = []
    for c in courses:
        student_count = db.query(Student).join(Student.courses).filter(Course.id == c.id).count()
        result.append({
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "description": c.description,
            "course_type": c.course_type,
            "status": c.status,
            "duration": c.duration or "Self-paced",
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "thumbnail_url": c.thumbnail_url,
            "student_count": student_count
        })
    return result

@router.post("/courses")
def create_course(
    data: CourseCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    existing = db.query(Course).filter(or_(Course.title == data.title, Course.code == data.code)).first()
    if existing:
        if existing.code == data.code:
            raise HTTPException(status_code=400, detail="A course with this code already exists")
        raise HTTPException(status_code=400, detail="A course with this title already exists")
    
    course = Course(
        institute_id=current_user.institute_id,
        title=data.title,
        code=data.code.upper(),
        description=data.description,
        course_type=data.course_type,
        visibility=data.visibility,
        status=data.status,
    )
    course.teachers.append(current_user)
    db.add(course)
    db.flush()
    
    # Create standard batches (Batch A, Batch B, Batch C) or requested batches
    batch_names = data.batches if data.batches and len(data.batches) > 0 else ["Batch A", "Batch B", "Batch C"]
    for b_name in batch_names:
        batch = Batch(
            institute_id=current_user.institute_id,
            name=b_name,
            course_id=course.id,
            status="Active"
        )
        db.add(batch)
        
    db.commit()
    db.refresh(course)
    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "message": "Course created successfully"
    }

@router.get("/courses/{course_id}")
def get_course_details(
    course_id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    course = verify_course_ownership(db, current_user.id, course_id)
    
    batches = [{"id": b.id, "name": b.name} for b in course.batches]
    live_classes = [
        {
            "id": lc.id, 
            "title": lc.title, 
            "scheduled_date": lc.scheduled_date.isoformat(), 
            "status": lc.status, 
            "meeting_link": lc.meeting_link
        } for lc in course.live_classes
    ]
    materials = [
        {
            "id": sm.id, 
            "title": sm.title, 
            "type": sm.material_type, 
            "visibility": sm.visibility, 
            "status": sm.status
        } for sm in course.study_materials
    ]
    quizzes = [
        {
            "id": q.id, 
            "title": q.title, 
            "duration": q.duration_minutes, 
            "marks": q.total_marks, 
            "status": q.status
        } for q in course.quizzes
    ]
    tasks = [
        {
            "id": t.id, 
            "title": t.title, 
            "deadline": t.deadline.isoformat(), 
            "status": t.status
        } for t in course.tasks
    ]
    
    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "duration": course.duration or "Self-paced",
        "start_date": course.start_date.isoformat() if course.start_date else None,
        "batches": batches,
        "live_classes": live_classes,
        "materials": materials,
        "quizzes": quizzes,
        "tasks": tasks
    }

@router.get("/courses/{course_id}/students")
def get_course_students(
    course_id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, course_id)
    students = db.query(Student).join(Student.courses).filter(Course.id == course_id).all()
    return [{"id": s.id, "name": s.name, "email": s.email, "phone": s.phone, "performance": s.performance} for s in students]

@router.get("/courses/{course_id}/activity")
def get_course_activity(
    course_id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, course_id)
    activities = db.query(CourseActivity).filter(CourseActivity.course_id == course_id).order_by(CourseActivity.timestamp.desc()).all()
    return [
        {
            "id": a.id,
            "student_name": a.student_name,
            "action": a.action,
            "detail": a.detail,
            "timestamp": a.timestamp.isoformat()
        }
        for a in activities
    ]

# --- LIVE CLASSES ENDPOINTS ---

@router.get("/live-classes")
def list_live_classes(
    status: Optional[str] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    if not assigned_course_ids:
        return []
        
    query = db.query(LiveClass).filter(LiveClass.course_id.in_(assigned_course_ids))
    if status:
        query = query.filter(LiveClass.status == status)
        
    classes = query.order_by(LiveClass.scheduled_date.asc()).all()
    return [
        {
            "id": c.id,
            "course_title": c.course.title if c.course else "General",
            "batch_name": c.batch.name if c.batch else "All Batches",
            "title": c.title,
            "description": c.description,
            "scheduled_date": c.scheduled_date.isoformat(),
            "status": c.status,
            "meeting_link": c.meeting_link,
            "live_class_url": c.meeting_link,
            "youtube_live_url": c.meeting_link,
            "recording_url": c.recording_url
        }
        for c in classes
    ]

@router.post("/live-classes")
def schedule_live_class(
    data: LiveClassCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, data.course_id)
    
    # Verify batch is in course
    batch = db.query(Batch).filter(Batch.id == data.batch_id, Batch.course_id == data.course_id).first()
    if not batch:
        raise HTTPException(status_code=400, detail="Batch does not belong to this course")
        
    meeting_url = data.meeting_link or data.live_class_url or data.youtube_live_url
    
    lc = LiveClass(
        course_id=data.course_id,
        batch_id=data.batch_id,
        teacher_id=current_user.id,
        title=data.title,
        description=data.description,
        scheduled_date=data.scheduled_date,
        meeting_link=meeting_url,
        status="upcoming"
    )
    db.add(lc)
    db.commit()
    db.refresh(lc)
    return {"message": "Live class scheduled successfully", "class_id": lc.id}

@router.get("/live-classes/{id}")
def get_live_class(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lc = db.query(LiveClass).filter(LiveClass.id == id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
    verify_course_ownership(db, current_user.id, lc.course_id)
    return {
        "id": lc.id,
        "course_id": lc.course_id,
        "batch_id": lc.batch_id,
        "title": lc.title,
        "description": lc.description,
        "scheduled_date": lc.scheduled_date.isoformat(),
        "meeting_link": lc.meeting_link,
        "recording_url": lc.recording_url,
        "status": lc.status
    }

@router.put("/live-classes/{id}")
def update_live_class(
    id: int,
    data: LiveClassUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lc = db.query(LiveClass).filter(LiveClass.id == id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
    verify_course_ownership(db, current_user.id, lc.course_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lc, key, value)
        
    db.commit()
    return {"message": "Live class updated successfully"}

@router.delete("/live-classes/{id}")
def cancel_live_class(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lc = db.query(LiveClass).filter(LiveClass.id == id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
    verify_course_ownership(db, current_user.id, lc.course_id)
    
    db.delete(lc)
    db.commit()
    return {"message": "Live class cancelled successfully"}

# --- ATTENDANCE ENDPOINTS ---

@router.get("/live-classes/{id}/attendance")
def get_class_attendance(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lc = db.query(LiveClass).filter(LiveClass.id == id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
    verify_course_ownership(db, current_user.id, lc.course_id)
    
    # Students in this course
    students = db.query(Student).join(Student.courses).filter(Course.id == lc.course_id).all()
    
    # Marked attendance
    records = db.query(LiveClassAttendance).filter(LiveClassAttendance.live_class_id == id).all()
    marked_map = {r.student_id: r.status for r in records}
    
    result = []
    for s in students:
        result.append({
            "student_id": s.id,
            "student_name": s.name,
            "email": s.email,
            "status": marked_map.get(s.id, "absent") # Default to absent if not marked
        })
    return result

class AttendanceSubmit(BaseModel):
    student_id: int
    status: str # present, absent, late

class AttendancePayload(BaseModel):
    records: List[AttendanceSubmit]

@router.post("/live-classes/{id}/attendance")
def save_class_attendance(
    id: int,
    payload: AttendancePayload,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lc = db.query(LiveClass).filter(LiveClass.id == id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Live class not found")
    verify_course_ownership(db, current_user.id, lc.course_id)
    
    # Delete existing to overwrite
    db.query(LiveClassAttendance).filter(LiveClassAttendance.live_class_id == id).delete()
    
    for r in payload.records:
        att = LiveClassAttendance(
            live_class_id=id,
            student_id=r.student_id,
            status=r.status,
            marked_by=current_user.id,
            marked_at=datetime.now()
        )
        db.add(att)
        
    lc.status = "completed" # Auto mark class completed when attendance is saved
    db.commit()
    return {"message": "Attendance saved successfully"}

@router.get("/attendance")
def get_attendance_log(
    course_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    student_name: Optional[str] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    query = db.query(LiveClassAttendance).join(LiveClassAttendance.live_class).join(LiveClassAttendance.student)
    query = query.filter(LiveClass.course_id.in_(assigned_course_ids))
    
    if course_id:
        query = query.filter(LiveClass.course_id == course_id)
    if batch_id:
        query = query.filter(LiveClass.batch_id == batch_id)
    if student_name:
        query = query.filter(Student.name.ilike(f"%{student_name}%"))
        
    records = query.order_by(LiveClassAttendance.marked_at.desc()).all()
    return [
        {
            "id": r.id,
            "student_name": r.student.name,
            "course_title": r.live_class.course.title,
            "batch_name": r.live_class.batch.name,
            "class_title": r.live_class.title,
            "status": r.status,
            "marked_at": r.marked_at.isoformat()
        }
        for r in records
    ]

@router.get("/attendance/export")
def export_attendance(
    course_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    query = db.query(LiveClassAttendance).join(LiveClassAttendance.live_class).join(LiveClassAttendance.student)
    query = query.filter(LiveClass.course_id.in_(assigned_course_ids))
    
    if course_id:
        verify_course_ownership(db, current_user.id, course_id)
        query = query.filter(LiveClass.course_id == course_id)
    if batch_id:
        query = query.filter(LiveClass.batch_id == batch_id)
        
    records = query.order_by(LiveClassAttendance.marked_at.desc()).all()
    
    headers = ["Student Name", "Course", "Batch", "Class Title", "Attendance Status", "Marked Date"]
    rows = []
    for r in records:
        rows.append([
            r.student.name,
            r.live_class.course.title,
            r.live_class.batch.name,
            r.live_class.title,
            r.status.capitalize(),
            r.marked_at.strftime("%Y-%m-%d %H:%M")
        ])
        
    excel_stream = generate_excel_report("Attendance Log", headers, rows)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="attendance_report.xlsx"'}
    )

# --- BOOKS ENDPOINTS ---

@router.get("/books")
def list_books(
    search: Optional[str] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    query = db.query(Book).join(Book.courses).filter(Course.id.in_(assigned_course_ids))
    if search:
        query = query.filter(or_(Book.title.ilike(f"%{search}%"), Book.author.ilike(f"%{search}%")))
        
    books = query.distinct().all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "description": b.description,
            "file_url": b.file_url,
            "status": b.status,
            "courses": [{"id": c.id, "title": c.title} for c in b.courses]
        }
        for b in books
    ]

@router.post("/books")
def create_book(
    data: BookCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    for course_id in data.course_ids:
        verify_course_ownership(db, current_user.id, course_id)
        
    book = Book(
        title=data.title,
        author=data.author,
        description=data.description,
        file_url=data.file_url,
        status="published",
        created_by=current_user.id
    )
    db.add(book)
    db.flush()
    
    # Map to courses
    courses = db.query(Course).filter(Course.id.in_(data.course_ids)).all()
    book.courses.extend(courses)
    
    db.commit()
    return {"message": "Book published successfully", "book_id": book.id}

@router.put("/books/{id}")
def update_book(
    id: int,
    data: BookUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    update_data = data.model_dump(exclude_unset=True)
    if "course_ids" in update_data:
        course_ids = update_data.pop("course_ids")
        for cid in course_ids:
            verify_course_ownership(db, current_user.id, cid)
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
        book.courses = courses
        
    for key, value in update_data.items():
        setattr(book, key, value)
        
    db.commit()
    return {"message": "Book updated successfully"}

@router.delete("/books/{id}")
def delete_book(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"}

# --- STUDY MATERIALS ENDPOINTS ---

@router.get("/materials")
def list_materials(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    query = db.query(StudyMaterial).filter(StudyMaterial.course_id.in_(assigned_course_ids))
    if course_id:
        verify_course_ownership(db, current_user.id, course_id)
        query = query.filter(StudyMaterial.course_id == course_id)
        
    materials = query.all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "file_url": m.file_url,
            "course_id": m.course_id,
            "course_title": m.course.title,
            "batch_name": m.batch.name if m.batch else "All Batches",
            "material_type": m.material_type,
            "visibility": m.visibility,
            "status": m.status
        }
        for m in materials
    ]

@router.post("/materials")
def create_material(
    data: StudyMaterialCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, data.course_id)
    
    mat = StudyMaterial(
        title=data.title,
        description=data.description,
        file_url=data.file_url,
        course_id=data.course_id,
        batch_id=data.batch_id,
        material_type=data.material_type,
        visibility=data.visibility,
        status=data.status,
        uploaded_by=current_user.id
    )
    db.add(mat)
    db.commit()
    return {"message": "Material created successfully"}

@router.put("/materials/{id}")
def update_material(
    id: int,
    data: StudyMaterialCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    mat = db.query(StudyMaterial).filter(StudyMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    verify_course_ownership(db, current_user.id, mat.course_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mat, key, value)
        
    db.commit()
    return {"message": "Material updated successfully"}

@router.delete("/materials/{id}")
def delete_material(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    mat = db.query(StudyMaterial).filter(StudyMaterial.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    verify_course_ownership(db, current_user.id, mat.course_id)
    
    db.delete(mat)
    db.commit()
    return {"message": "Material deleted successfully"}

# --- QUIZZES ENDPOINTS ---

@router.get("/quizzes")
def list_quizzes(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    quizzes = db.query(Quiz).filter(Quiz.course_id.in_(assigned_course_ids)).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "course_title": q.course.title,
            "duration_minutes": q.duration_minutes,
            "total_marks": q.total_marks,
            "status": q.status,
            "question_count": len(q.questions)
        }
        for q in quizzes
    ]

@router.post("/quizzes")
def create_quiz(
    data: QuizCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, data.course_id)
    
    quiz = Quiz(
        title=data.title,
        description=data.description,
        course_id=data.course_id,
        batch_id=data.batch_id,
        duration_minutes=data.duration_minutes,
        total_marks=data.total_marks,
        start_date=data.start_date,
        end_date=data.end_date,
        status="draft",
        created_by=current_user.id
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return {"message": "Quiz draft created successfully", "quiz_id": quiz.id}

@router.get("/quizzes/{id}")
def get_quiz_details(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).options(
        joinedload(Quiz.questions).joinedload(QuizQuestion.options)
    ).filter(Quiz.id == id).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    verify_course_ownership(db, current_user.id, quiz.course_id)
    
    questions = []
    for q in quiz.questions:
        options = [{"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct} for o in q.options]
        questions.append({
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "marks": q.marks,
            "options": options
        })
        
    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "course_id": quiz.course_id,
        "batch_id": quiz.batch_id,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "status": quiz.status,
        "questions": questions
    }

@router.put("/quizzes/{id}")
def update_quiz(
    id: int,
    data: QuizUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    verify_course_ownership(db, current_user.id, quiz.course_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(quiz, key, value)
        
    db.commit()
    return {"message": "Quiz updated successfully"}

@router.delete("/quizzes/{id}")
def delete_quiz(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    verify_course_ownership(db, current_user.id, quiz.course_id)
    
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

@router.post("/quizzes/{id}/questions")
def save_quiz_questions(
    id: int,
    payload: List[QuizQuestionCreate],
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    verify_course_ownership(db, current_user.id, quiz.course_id)
    
    # Delete old questions
    db.query(QuizQuestion).filter(QuizQuestion.quiz_id == id).delete()
    
    for q_data in payload:
        q = QuizQuestion(
            quiz_id=id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            marks=q_data.marks
        )
        db.add(q)
        db.flush()
        
        for o_data in q_data.options:
            o = QuizOption(
                question_id=q.id,
                option_text=o_data.option_text,
                is_correct=o_data.is_correct
            )
            db.add(o)
            
    db.commit()
    return {"message": "Questions saved successfully"}

@router.get("/quizzes/{id}/attempts")
def get_quiz_attempts(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    verify_course_ownership(db, current_user.id, quiz.course_id)
    
    attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id == id).all()
    return [
        {
            "id": a.id,
            "student_name": a.student.name,
            "email": a.student.email,
            "score": a.score,
            "status": a.status,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None
        }
        for a in attempts
    ]

# --- TASKS & ASSIGNMENTS ENDPOINTS ---

@router.get("/tasks")
def list_tasks(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    tasks = db.query(Task).filter(Task.course_id.in_(assigned_course_ids)).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "course_title": t.course.title,
            "deadline": t.deadline.isoformat(),
            "status": t.status
        }
        for t in tasks
    ]

@router.post("/tasks")
def create_task(
    data: TaskCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, data.course_id)
    
    task = Task(
        title=data.title,
        description=data.description,
        course_id=data.course_id,
        batch_id=data.batch_id,
        teacher_id=current_user.id,
        deadline=data.deadline,
        status="draft"
    )
    db.add(task)
    db.flush()
    
    if data.attachment_urls:
        for url in data.attachment_urls:
            filename = os.path.basename(url)
            attach = TaskAttachment(task_id=task.id, file_name=filename, file_url=url)
            db.add(attach)
            
    db.commit()
    return {"message": "Assignment created successfully", "task_id": task.id}

@router.get("/tasks/{id}")
def get_task(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Assignment not found")
    verify_course_ownership(db, current_user.id, task.course_id)
    
    attachments = [{"id": a.id, "file_name": a.file_name, "file_url": a.file_url} for a in task.attachments]
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "course_id": task.course_id,
        "batch_id": task.batch_id,
        "deadline": task.deadline.isoformat(),
        "status": task.status,
        "attachments": attachments
    }

@router.put("/tasks/{id}")
def update_task(
    id: int,
    data: TaskUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Assignment not found")
    verify_course_ownership(db, current_user.id, task.course_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    return {"message": "Assignment updated successfully"}

@router.delete("/tasks/{id}")
def delete_task(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Assignment not found")
    verify_course_ownership(db, current_user.id, task.course_id)
    
    db.delete(task)
    db.commit()
    return {"message": "Assignment deleted successfully"}

@router.get("/tasks/{id}/submissions")
def get_task_submissions(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Assignment not found")
    verify_course_ownership(db, current_user.id, task.course_id)
    
    submissions = db.query(TaskSubmission).filter(TaskSubmission.task_id == id).all()
    return [
        {
            "id": s.id,
            "student_name": s.student.name,
            "email": s.student.email,
            "submitted_at": s.submitted_at.isoformat(),
            "file_url": s.file_url,
            "status": s.status,
            "grade": s.grade,
            "feedback": s.feedback
        }
        for s in submissions
    ]

@router.put("/submissions/{submission_id}")
def grade_submission(
    submission_id: int,
    payload: SubmissionGrade,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    sub = db.query(TaskSubmission).filter(TaskSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    verify_course_ownership(db, current_user.id, sub.task.course_id)
    
    sub.grade = payload.grade
    sub.feedback = payload.feedback
    sub.status = "graded"
    db.commit()
    return {"message": "Submission graded successfully"}

# --- WEBINARS ENDPOINTS ---

@router.get("/webinars")
def list_webinars(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    webinars = db.query(Webinar).filter(Webinar.course_id.in_(assigned_course_ids)).all()
    return [
        {
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "speaker_name": w.speaker_name,
            "course_title": w.course.title,
            "scheduled_date": w.scheduled_date.isoformat(),
            "meeting_url": w.meeting_url,
            "status": w.status
        }
        for w in webinars
    ]

@router.post("/webinars")
def create_webinar(
    data: WebinarCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    verify_course_ownership(db, current_user.id, data.course_id)
    
    webinar = Webinar(
        title=data.title,
        description=data.description,
        speaker_name=data.speaker_name,
        course_id=data.course_id,
        scheduled_date=data.scheduled_date,
        meeting_url=data.meeting_url,
        status="upcoming",
        created_by=current_user.id
    )
    db.add(webinar)
    db.commit()
    return {"message": "Webinar scheduled successfully"}

@router.put("/webinars/{id}")
def update_webinar(
    id: int,
    data: WebinarCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    webinar = db.query(Webinar).filter(Webinar.id == id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    verify_course_ownership(db, current_user.id, webinar.course_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(webinar, key, value)
        
    db.commit()
    return {"message": "Webinar updated successfully"}

@router.delete("/webinars/{id}")
def delete_webinar(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    webinar = db.query(Webinar).filter(Webinar.id == id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    verify_course_ownership(db, current_user.id, webinar.course_id)
    
    db.delete(webinar)
    db.commit()
    return {"message": "Webinar deleted successfully"}

# --- LEADS ENDPOINTS ---

@router.get("/leads")
def list_leads(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    leads = db.query(Lead).filter(Lead.assigned_to == current_user.id).all()
    return [
        {
            "id": l.id,
            "name": l.name,
            "phone": l.phone,
            "course_interest": l.course_interest,
            "source": l.source,
            "status": l.status,
            "inquiry_date": l.inquiry_date.isoformat(),
            "last_followup": l.last_followup.isoformat() if l.last_followup else None,
            "notes": l.notes
        }
        for l in leads
    ]

@router.get("/leads/{id}")
def get_lead(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access Denied: Lead is not assigned to you")
        
    followups = [{"id": f.id, "note": f.note, "followup_date": f.followup_date.isoformat()} for f in lead.followups]
    return {
        "id": lead.id,
        "name": lead.name,
        "phone": lead.phone,
        "course_interest": lead.course_interest,
        "source": lead.source,
        "status": lead.status,
        "notes": lead.notes,
        "followups": followups
    }

@router.post("/leads/{id}/followups")
def add_lead_followup(
    id: int,
    payload: FollowupCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access Denied: Lead is not assigned to you")
        
    fp = LeadFollowup(
        lead_id=id,
        note=payload.note,
        created_by=current_user.id
    )
    db.add(fp)
    lead.last_followup = datetime.now()
    lead.status = "Follow-up"
    db.commit()
    return {"message": "Followup added successfully"}

# --- STUDENTS ENDPOINTS ---

@router.get("/students")
def list_students(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    students = db.query(Student).join(Student.courses).filter(Course.id.in_(assigned_course_ids)).distinct().all()
    
    result = []
    for s in students:
        # Get latest activity
        act = db.query(CourseActivity).filter(CourseActivity.student_id == s.id).order_by(CourseActivity.timestamp.desc()).first()
        latest_act = act.action if act else "No recent activity"
        
        # Calculate general attendance
        attendance_recs = db.query(LiveClassAttendance).filter(LiveClassAttendance.student_id == s.id).all()
        att_rate = 100.0
        if attendance_recs:
            present = sum(1 for r in attendance_recs if r.status == "present")
            att_rate = (present / len(attendance_recs)) * 100.0
            
        result.append({
            "id": s.id,
            "name": s.name,
            "phone": s.phone,
            "email": s.email,
            "course": ", ".join([c.title for c in s.courses]),
            "attendance": f"{round(att_rate, 1)}%",
            "latest_activity": latest_act
        })
    return result

@router.get("/students/{id}")
def get_student_profile(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Check if student is in any of the teacher's courses
    shared_courses = [c for c in student.courses if c.id in assigned_course_ids]
    if not shared_courses:
        raise HTTPException(status_code=403, detail="Access Denied: Student is not in your courses")
        
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "performance": student.performance,
        "joined_at": student.joined_at.isoformat(),
        "courses": [{"id": c.id, "title": c.title, "code": c.code} for c in student.courses]
    }

@router.get("/students/{id}/activity")
def get_student_activities(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    activities = db.query(CourseActivity).filter(
        CourseActivity.student_id == id,
        CourseActivity.course_id.in_(assigned_course_ids)
    ).order_by(CourseActivity.timestamp.desc()).all()
    
    return [
        {
            "id": a.id,
            "action": a.action,
            "detail": a.detail,
            "timestamp": a.timestamp.isoformat()
        }
        for a in activities
    ]

@router.get("/students/{id}/attendance")
def get_student_attendance(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    records = db.query(LiveClassAttendance).join(LiveClassAttendance.live_class).filter(
        LiveClassAttendance.student_id == id,
        LiveClass.course_id.in_(assigned_course_ids)
    ).order_by(LiveClassAttendance.marked_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "class_title": r.live_class.title,
            "status": r.status,
            "marked_at": r.marked_at.isoformat()
        }
        for r in records
    ]

# --- NEWSFEED ENDPOINTS ---

@router.get("/newsfeed")
def list_newsfeed(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    posts = db.query(NewsfeedPost).order_by(NewsfeedPost.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "type": p.type,
            "file_url": p.file_url,
            "author_name": p.author.username,
            "created_at": p.created_at.isoformat(),
            "can_delete": p.created_by == current_user.id
        }
        for p in posts
    ]

@router.post("/newsfeed")
def create_newsfeed_post(
    data: NewsfeedPostCreate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    post = NewsfeedPost(
        title=data.title,
        content=data.content,
        type=data.type,
        file_url=data.file_url,
        created_by=current_user.id
    )
    db.add(post)
    db.commit()
    return {"message": "Newsfeed post created successfully"}

@router.delete("/newsfeed/{id}")
def delete_newsfeed_post(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    post = db.query(NewsfeedPost).filter(NewsfeedPost.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access Denied: You did not create this post")
        
    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}

# --- CHAT ENDPOINTS ---

@router.get("/chat/contacts")
def list_chat_contacts(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    # Admins
    admins = db.query(User).join(User.roles).filter(Role.name == "admin").all()
    
    # Enrolled students in assigned courses
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    students = db.query(Student).join(Student.courses).filter(Course.id.in_(assigned_course_ids)).all()
    
    contacts = []
    for a in admins:
        if a.id != current_user.id:
            contacts.append({"id": a.id, "name": a.username.capitalize(), "role": "Admin", "email": a.email})
            
    # Students who have registered users (we match by student.email == user.email)
    for s in students:
        s_user = db.query(User).filter(User.email == s.email).first()
        if s_user:
            contacts.append({"id": s_user.id, "name": s.name, "role": "Student", "email": s.email})
            
    return contacts

@router.get("/chat/conversations")
def list_conversations(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    participations = db.query(ChatParticipant).filter(ChatParticipant.user_id == current_user.id).all()
    conversation_ids = [p.conversation_id for p in participations]
    
    conversations = db.query(ChatConversation).options(
        joinedload(ChatConversation.participants).joinedload(ChatParticipant.user),
        joinedload(ChatConversation.messages)
    ).filter(ChatConversation.id.in_(conversation_ids)).all()
    
    result = []
    for c in conversations:
        # Find partner
        partner = next((p.user for p in c.participants if p.user_id != current_user.id), None)
        if not partner:
            continue
            
        latest_msg = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).order_by(ChatMessage.created_at.desc()).first()
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == c.id,
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False
        ).count()
        
        result.append({
            "id": c.id,
            "partner_name": partner.username.capitalize(),
            "partner_id": partner.id,
            "latest_message": latest_msg.message_text if latest_msg else "",
            "latest_message_time": latest_msg.created_at.isoformat() if latest_msg else c.created_at.isoformat(),
            "unread_count": unread_count
        })
    return result

class ConversationInit(BaseModel):
    recipient_id: int

@router.post("/chat/conversations")
def init_conversation(
    payload: ConversationInit,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    recipient = db.query(User).filter(User.id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")
        
    # Check permission boundary
    is_admin = "admin" in [r.name.lower() for r in recipient.roles]
    
    # If not admin, check if student belongs to course
    if not is_admin:
        assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
        assigned_course_ids = [c.id for c in assigned_courses]
        student = db.query(Student).join(Student.courses).filter(
            Student.email == recipient.email,
            Course.id.in_(assigned_course_ids)
        ).first()
        
        if not student:
            raise HTTPException(status_code=403, detail="Communication forbidden: Recipient student is not in your courses")
            
    # Check if conversation already exists
    existing = db.query(ChatConversation).join(ChatConversation.participants).filter(
        ChatParticipant.user_id.in_([current_user.id, recipient.id])
    ).group_by(ChatConversation.id).having(func.count(ChatParticipant.id) == 2).first()
    
    if existing:
        return {"conversation_id": existing.id}
        
    # Create new
    conv = ChatConversation()
    db.add(conv)
    db.flush()
    
    cp1 = ChatParticipant(conversation_id=conv.id, user_id=current_user.id)
    cp2 = ChatParticipant(conversation_id=conv.id, user_id=recipient.id)
    db.add(cp1)
    db.add(cp2)
    
    db.commit()
    return {"conversation_id": conv.id}

@router.get("/chat/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    # Verify participant
    part = db.query(ChatParticipant).filter(
        ChatParticipant.conversation_id == conversation_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
    messages = db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).order_by(ChatMessage.created_at.asc()).all()
    
    # Mark incoming as read
    db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id,
        ChatMessage.sender_id != current_user.id
    ).update({"is_read": True})
    db.commit()
    
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "message_text": m.message_text,
            "created_at": m.created_at.isoformat()
        }
        for m in messages
    ]

@router.post("/chat/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    payload: MessageSend,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    part = db.query(ChatParticipant).filter(
        ChatParticipant.conversation_id == conversation_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
    msg = ChatMessage(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        message_text=payload.message_text,
        created_at=datetime.now()
    )
    db.add(msg)
    db.commit()
    return {"message": "Message sent successfully"}

# --- NOTIFICATIONS ENDPOINTS ---

@router.get("/notifications")
def list_notifications(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    records = db.query(UserNotification).options(
        joinedload(UserNotification.notification)
    ).filter(UserNotification.user_id == current_user.id).order_by(UserNotification.id.desc()).all()
    
    return [
        {
            "id": r.notification.id,
            "user_notification_id": r.id,
            "title": r.notification.title,
            "message": r.notification.message,
            "type": r.notification.notification_type,
            "redirect_url": r.notification.redirect_url,
            "is_read": r.is_read,
            "created_at": r.notification.created_at.isoformat()
        }
        for r in records
    ]

@router.put("/notifications/{id}/read")
def mark_notification_read(
    id: int,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    un = db.query(UserNotification).filter(
        UserNotification.notification_id == id,
        UserNotification.user_id == current_user.id
    ).first()
    if not un:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    un.is_read = True
    un.read_at = datetime.now()
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    db.query(UserNotification).filter(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False
    ).update({"is_read": True, "read_at": datetime.now()})
    db.commit()
    return {"message": "All notifications marked as read"}

# --- REPORTS ENDPOINTS ---

@router.get("/reports/attendance")
def report_attendance(
    course_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    # Filter courses
    target_course_ids = [course_id] if course_id else assigned_course_ids
    # Check permission
    for cid in target_course_ids:
        if cid not in assigned_course_ids:
            raise HTTPException(status_code=403, detail="Unauthorized course query")
            
    # List of enrolled students
    students = db.query(Student).join(Student.courses).filter(Course.id.in_(target_course_ids)).all()
    
    rows = []
    total_present = 0
    total_absent = 0
    
    for s in students:
        # filter records
        q = db.query(LiveClassAttendance).join(LiveClassAttendance.live_class).filter(
            LiveClassAttendance.student_id == s.id,
            LiveClass.course_id.in_(target_course_ids)
        )
        if batch_id:
            q = q.filter(LiveClass.batch_id == batch_id)
            
        recs = q.all()
        present = sum(1 for r in recs if r.status == "present")
        absent = sum(1 for r in recs if r.status == "absent")
        
        total_present += present
        total_absent += absent
        
        rate = 100.0
        if recs:
            rate = (present / len(recs)) * 100.0
            
        rows.append({
            "student_name": s.name,
            "courses": ", ".join([c.code for c in s.courses if c.id in target_course_ids]),
            "present": present,
            "absent": absent,
            "percentage": f"{round(rate, 1)}%"
        })
        
    grand_total = total_present + total_absent
    avg_rate = 100.0
    if grand_total > 0:
        avg_rate = (total_present / grand_total) * 100.0
        
    return {
        "summary": {
            "total_present": total_present,
            "total_absent": total_absent,
            "average_rate": f"{round(avg_rate, 1)}%"
        },
        "details": rows
    }

@router.get("/reports/attendance/export")
def report_attendance_export(
    course_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    data = report_attendance(course_id, batch_id, current_user, db)
    headers = ["Student Name", "Courses", "Classes Present", "Classes Absent", "Attendance Rate"]
    rows = [[r["student_name"], r["courses"], r["present"], r["absent"], r["percentage"]] for r in data["details"]]
    
    excel_stream = generate_excel_report("Attendance Performance Report", headers, rows)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_performance_report.xlsx"}
    )

@router.get("/reports/quiz")
def report_quiz(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    target_course_ids = [course_id] if course_id else assigned_course_ids
    for cid in target_course_ids:
        if cid not in assigned_course_ids:
            raise HTTPException(status_code=403, detail="Unauthorized course query")
            
    attempts = db.query(QuizAttempt).join(QuizAttempt.quiz).filter(
        Quiz.course_id.in_(target_course_ids)
    ).all()
    
    rows = []
    total_score = 0
    total_marks = 0
    for a in attempts:
        pct = (a.score / a.quiz.total_marks) * 100.0 if a.quiz.total_marks > 0 else 0.0
        total_score += a.score
        total_marks += a.quiz.total_marks
        rows.append({
            "quiz_title": a.quiz.title,
            "student_name": a.student.name,
            "score": a.score,
            "total_marks": a.quiz.total_marks,
            "percentage": f"{round(pct, 1)}%",
            "completed_at": a.completed_at.strftime("%Y-%m-%d") if a.completed_at else "Ongoing"
        })
        
    avg_score_pct = (total_score / total_marks) * 100.0 if total_marks > 0 else 100.0
    return {
        "summary": {
            "total_attempts": len(attempts),
            "average_percentage": f"{round(avg_score_pct, 1)}%"
        },
        "details": rows
    }

@router.get("/reports/quiz/export")
def report_quiz_export(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    data = report_quiz(course_id, current_user, db)
    headers = ["Quiz Title", "Student Name", "Score Obtained", "Total Marks", "Percentage", "Completed Date"]
    rows = [[r["quiz_title"], r["student_name"], r["score"], r["total_marks"], r["percentage"], r["completed_at"]] for r in data["details"]]
    
    excel_stream = generate_excel_report("Quiz Performance Report", headers, rows)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="quiz_performance_report.xlsx"'}
    )

@router.get("/reports/tasks")
def report_tasks(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    target_course_ids = [course_id] if course_id else assigned_course_ids
    for cid in target_course_ids:
        if cid not in assigned_course_ids:
            raise HTTPException(status_code=403, detail="Unauthorized course query")
            
    submissions = db.query(TaskSubmission).join(TaskSubmission.task).filter(
        Task.course_id.in_(target_course_ids)
    ).all()
    
    rows = []
    graded_count = 0
    pending_count = 0
    for s in submissions:
        is_late = s.submitted_at > s.task.deadline
        if s.status == "graded":
            graded_count += 1
        else:
            pending_count += 1
            
        rows.append({
            "task_title": s.task.title,
            "student_name": s.student.name,
            "submitted_date": s.submitted_at.strftime("%Y-%m-%d"),
            "status": s.status.capitalize(),
            "late": "Late" if is_late else "On Time",
            "grade": s.grade or "N/A"
        })
        
    return {
        "summary": {
            "total_submissions": len(submissions),
            "graded_count": graded_count,
            "pending_count": pending_count
        },
        "details": rows
    }

@router.get("/reports/tasks/export")
def report_tasks_export(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    data = report_tasks(course_id, current_user, db)
    headers = ["Task Title", "Student Name", "Submitted Date", "Grading Status", "On-Time Status", "Grade"]
    rows = [[r["task_title"], r["student_name"], r["submitted_date"], r["status"], r["late"], r["grade"]] for r in data["details"]]
    
    excel_stream = generate_excel_report("Assignments Performance Report", headers, rows)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="assignments_performance_report.xlsx"'}
    )

@router.get("/reports/activity")
def report_activity(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_courses = db.query(Course).filter(Course.teachers.any(id=current_user.id)).all()
    assigned_course_ids = [c.id for c in assigned_courses]
    
    target_course_ids = [course_id] if course_id else assigned_course_ids
    for cid in target_course_ids:
        if cid not in assigned_course_ids:
            raise HTTPException(status_code=403, detail="Unauthorized course query")
            
    activities = db.query(CourseActivity).filter(
        CourseActivity.course_id.in_(target_course_ids)
    ).order_by(CourseActivity.timestamp.desc()).all()
    
    rows = []
    for a in activities:
        rows.append({
            "student_name": a.student_name,
            "course_title": a.course.title,
            "action": a.action.capitalize(),
            "detail": a.detail,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M")
        })
        
    return {
        "summary": {
            "total_activities": len(activities)
        },
        "details": rows
    }

@router.get("/reports/activity/export")
def report_activity_export(
    course_id: Optional[int] = None,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    data = report_activity(course_id, current_user, db)
    headers = ["Student Name", "Course", "Action Type", "Detail Log", "Timestamp"]
    rows = [[r["student_name"], r["course_title"], r["action"], r["detail"], r["timestamp"]] for r in data["details"]]
    
    excel_stream = generate_excel_report("Course Activity Audit Report", headers, rows)
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="course_activity_audit_report.xlsx"'}
    )

# --- SETTINGS ENDPOINTS ---

@router.get("/settings")
def get_settings(
    current_user: User = Depends(require_role("teacher"))
):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "phone": current_user.phone
    }

@router.put("/settings/profile")
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    # Check unique constraints if changed
    if payload.email != current_user.email:
        exist = db.query(User).filter(User.email == payload.email).first()
        if exist:
            raise HTTPException(status_code=400, detail="Email is already in use")
            
    if payload.username != current_user.username:
        exist = db.query(User).filter(User.username == payload.username).first()
        if exist:
            raise HTTPException(status_code=400, detail="Username is already in use")
            
    current_user.username = payload.username
    current_user.email = payload.email
    current_user.phone = payload.phone
    db.commit()
    return {"message": "Profile updated successfully"}

@router.put("/settings/password")
def change_password(
    payload: PasswordUpdate,
    current_user: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    if payload.current_password and not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    current_user.hashed_password = get_password_hash(payload.new_password)
    
    # Invalidate other refresh tokens / active sessions
    db.query(User).filter(User.id == current_user.id).update(
        {User.updated_at: datetime.now()}
    )
    db.commit()
    return {"message": "Password changed successfully"}
