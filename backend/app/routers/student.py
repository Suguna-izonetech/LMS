from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.models.all_models import (
    User, Course, Batch, Student, LiveClass, 
    LiveClassAttendance, Book, StudyMaterial, Quiz, QuizQuestion, 
    QuizOption, QuizAttempt, QuizAnswer, Task, TaskAttachment, 
    TaskSubmission, Webinar, CertificateRecord, UserNotification
)
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/student", tags=["student"])

# --- PYDANTIC SCHEMAS ---

class QuizAnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: int

class QuizSubmitPayload(BaseModel):
    answers: List[QuizAnswerSubmit]

class TaskSubmissionCreate(BaseModel):
    file_url: str

# --- HELPER UTILITY ---

def get_student_entity(db: Session, current_user: User) -> Optional[Student]:
    """Link User entity with Student record via email or username."""
    return db.query(Student).filter(
        or_(Student.email == current_user.email, Student.name == current_user.username)
    ).first()

def get_student_courses(db: Session, current_user: User) -> List[Course]:
    student_obj = get_student_entity(db, current_user)
    if student_obj and student_obj.courses:
        return student_obj.courses
    # Fallback to all published courses in current institute for demonstration/enrollment
    return db.query(Course).all()

# --- STUDENT API ENDPOINTS ---

@router.get("/dashboard")
def get_student_dashboard(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    courses = get_student_courses(db, current_user)
    course_ids = [c.id for c in courses]
    
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    today_classes = db.query(LiveClass).filter(
        LiveClass.course_id.in_(course_ids),
        LiveClass.scheduled_date >= today_start,
        LiveClass.scheduled_date <= today_end
    ).all()
    
    upcoming_classes = db.query(LiveClass).filter(
        LiveClass.course_id.in_(course_ids),
        LiveClass.scheduled_date > today_end,
        LiveClass.status == "upcoming"
    ).all()
    
    pending_tasks = db.query(Task).filter(
        Task.course_id.in_(course_ids),
        Task.status == "published"
    ).count()
    
    active_quizzes = db.query(Quiz).filter(
        Quiz.course_id.in_(course_ids),
        Quiz.status == "published"
    ).count()
    
    student_obj = get_student_entity(db, current_user)
    certificates_count = 0
    if student_obj:
        certificates_count = db.query(CertificateRecord).filter(
            CertificateRecord.student_id == student_obj.id,
            CertificateRecord.status == "issued"
        ).count()
        
    recent_notifications = db.query(UserNotification).options(
        joinedload(UserNotification.notification)
    ).filter(
        UserNotification.user_id == current_user.id
    ).order_by(UserNotification.is_read.asc(), UserNotification.id.desc()).limit(5).all()

    return {
        "enrolled_courses_count": len(courses),
        "today_classes": [
            {
                "id": c.id, 
                "title": c.title, 
                "course_title": c.course.title,
                "time": c.scheduled_date.strftime("%I:%M %p"), 
                "meeting_link": c.meeting_link, 
                "status": c.status
            }
            for c in today_classes
        ],
        "upcoming_classes_count": len(upcoming_classes),
        "pending_tasks_count": pending_tasks,
        "active_quizzes_count": active_quizzes,
        "certificates_count": certificates_count,
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
        ]
    }

@router.get("/courses")
def get_my_courses(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    courses = get_student_courses(db, current_user)
    result = []
    for c in courses:
        modules_count = len(c.prerecorded_modules) if hasattr(c, 'prerecorded_modules') else 0
        quizzes_count = len(c.quizzes)
        tasks_count = len(c.tasks)
        result.append({
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "description": c.description,
            "progress_pct": 45,
            "modules_count": modules_count,
            "quizzes_count": quizzes_count,
            "tasks_count": tasks_count
        })
    return result

@router.get("/courses/{course_id}")
def get_course_detail(
    course_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    return {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "live_classes": [
            {
                "id": lc.id, 
                "title": lc.title, 
                "scheduled_date": lc.scheduled_date.isoformat(), 
                "status": lc.status, 
                "meeting_link": lc.meeting_link,
                "recording_url": lc.recording_url
            } for lc in course.live_classes
        ],
        "materials": [
            {
                "id": sm.id, 
                "title": sm.title, 
                "material_type": sm.material_type, 
                "file_url": sm.file_url,
                "visibility": sm.visibility
            } for sm in course.study_materials if sm.status == "published"
        ],
        "quizzes": [
            {
                "id": q.id, 
                "title": q.title, 
                "duration_minutes": q.duration_minutes, 
                "total_marks": q.total_marks, 
                "status": q.status
            } for q in course.quizzes if q.status == "published"
        ],
        "tasks": [
            {
                "id": t.id, 
                "title": t.title, 
                "deadline": t.deadline.isoformat(), 
                "status": t.status
            } for t in course.tasks if t.status == "published"
        ]
    }

@router.get("/live-classes")
def get_student_live_classes(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    courses = get_student_courses(db, current_user)
    course_ids = [c.id for c in courses]
    classes = db.query(LiveClass).options(
        joinedload(LiveClass.course), 
        joinedload(LiveClass.batch)
    ).filter(LiveClass.course_id.in_(course_ids)).order_by(LiveClass.scheduled_date.asc()).all()
    return [
        {
            "id": c.id,
            "course_title": c.course.title,
            "batch_name": c.batch.name if c.batch else "General",
            "title": c.title,
            "description": c.description,
            "scheduled_date": c.scheduled_date.isoformat(),
            "status": c.status,
            "meeting_link": c.meeting_link,
            "recording_url": c.recording_url
        }
        for c in classes
    ]

@router.get("/materials")
def get_student_materials(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    courses = get_student_courses(db, current_user)
    course_ids = [c.id for c in courses]
    
    materials = db.query(StudyMaterial).options(
        joinedload(StudyMaterial.course)
    ).filter(
        StudyMaterial.course_id.in_(course_ids),
        StudyMaterial.status == "published"
    ).all()
    
    books = db.query(Book).join(Book.courses).filter(
        Course.id.in_(course_ids),
        Book.status == "published"
    ).distinct().all()
    
    return {
        "study_materials": [
            {
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "file_url": m.file_url,
                "course_title": m.course.title,
                "material_type": m.material_type
            }
            for m in materials
        ],
        "books": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "description": b.description,
                "file_url": b.file_url
            }
            for b in books
        ]
    }

@router.get("/quizzes")
def get_student_quizzes(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    courses = get_student_courses(db, current_user)
    course_ids = [c.id for c in courses]
    
    quizzes = db.query(Quiz).options(
        joinedload(Quiz.course)
    ).filter(
        Quiz.course_id.in_(course_ids),
        Quiz.status == "published"
    ).all()
    
    student_obj = get_student_entity(db, current_user)
    attempts = []
    if student_obj:
        attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_obj.id).all()
    attempt_map = {a.quiz_id: a for a in attempts}
    
    return [
        {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "course_title": q.course.title,
            "duration_minutes": q.duration_minutes,
            "total_marks": q.total_marks,
            "attempted": q.id in attempt_map,
            "score": attempt_map[q.id].score if q.id in attempt_map else None,
            "attempt_status": attempt_map[q.id].status if q.id in attempt_map else "unattempted"
        }
        for q in quizzes
    ]

@router.get("/quizzes/{quiz_id}")
def get_quiz_questions(
    quiz_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "duration_minutes": quiz.duration_minutes,
        "total_marks": quiz.total_marks,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "marks": q.marks,
                "options": [
                    {"id": o.id, "option_text": o.option_text} for o in q.options
                ]
            }
            for q in quiz.questions
        ]
    }

@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitPayload,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    student_obj = get_student_entity(db, current_user)
    if not student_obj:
        student_obj = Student(name=current_user.username, email=current_user.email, performance="Good")
        db.add(student_obj)
        db.flush()
        
    score = 0
    for ans in payload.answers:
        option = db.query(QuizOption).filter(QuizOption.id == ans.selected_option_id).first()
        if option and option.is_correct:
            question = db.query(QuizQuestion).filter(QuizQuestion.id == ans.question_id).first()
            score += question.marks if question else 0
            
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_obj.id,
        score=score,
        status="submitted",
        started_at=datetime.now(),
        completed_at=datetime.now()
    )
    db.add(attempt)
    db.flush()
    
    for ans in payload.answers:
        quiz_ans = QuizAnswer(
            attempt_id=attempt.id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id
        )
        db.add(quiz_ans)
        
    db.commit()
    return {"message": "Quiz submitted successfully", "score": score, "total_marks": quiz.total_marks}

@router.get("/tasks")
def get_student_tasks(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    courses = get_student_courses(db, current_user)
    course_ids = [c.id for c in courses]
    
    tasks = db.query(Task).options(
        joinedload(Task.course),
        joinedload(Task.attachments)
    ).filter(
        Task.course_id.in_(course_ids),
        Task.status == "published"
    ).all()
    
    student_obj = get_student_entity(db, current_user)
    submissions = []
    if student_obj:
        submissions = db.query(TaskSubmission).filter(TaskSubmission.student_id == student_obj.id).all()
    sub_map = {s.task_id: s for s in submissions}
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "course_title": t.course.title,
            "deadline": t.deadline.isoformat(),
            "attachments": [{"id": a.id, "file_name": a.file_name, "file_url": a.file_url} for a in t.attachments],
            "submitted": t.id in sub_map,
            "submission_status": sub_map[t.id].status if t.id in sub_map else "pending",
            "submission_file": sub_map[t.id].file_url if t.id in sub_map else None,
            "feedback": sub_map[t.id].feedback if t.id in sub_map else None
        }
        for t in tasks
    ]

@router.post("/tasks/{task_id}/submit")
def submit_task(
    task_id: int,
    payload: TaskSubmissionCreate,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    student_obj = get_student_entity(db, current_user)
    if not student_obj:
        student_obj = Student(name=current_user.username, email=current_user.email, performance="Good")
        db.add(student_obj)
        db.flush()
        
    sub = db.query(TaskSubmission).filter(TaskSubmission.task_id == task_id, TaskSubmission.student_id == student_obj.id).first()
    if sub:
        sub.file_url = payload.file_url
        sub.submitted_at = datetime.now()
        sub.status = "pending"
    else:
        sub = TaskSubmission(
            task_id=task_id,
            student_id=student_obj.id,
            file_url=payload.file_url,
            status="pending",
            submitted_at=datetime.now()
        )
        db.add(sub)
        
    db.commit()
    return {"message": "Assignment submitted successfully"}

@router.get("/certificates")
def get_student_certificates(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    student_obj = get_student_entity(db, current_user)
    if not student_obj:
        return []
        
    records = db.query(CertificateRecord).options(
        joinedload(CertificateRecord.course),
        joinedload(CertificateRecord.template)
    ).filter(CertificateRecord.student_id == student_obj.id).all()
    return [
        {
            "id": r.id,
            "certificate_number": r.certificate_number,
            "course_title": r.course.title if r.course else "Course Completion",
            "template_name": r.template.name if r.template else "Standard Template",
            "issued_at": r.issue_date.strftime("%B %d, %Y") if r.issue_date else "Recently",
            "status": r.status
        }
        for r in records
    ]
