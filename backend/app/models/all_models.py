from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Text, Table, Float, func, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

# Association table for User and Role (Many-to-Many)
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

# Association table for Role and Permission (Many-to-Many)
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)


class Institute(Base):
    __tablename__ = "institutes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    subdomain = Column(String(100), unique=True, index=True, nullable=True)
    custom_domain = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    about_text = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    google_maps_link = Column(String, nullable=True)
    seo_metadata = Column(String, default="{}") # JSON
    youtube_link = Column(String, nullable=True)
    social_links = Column(String, default="{}") # JSON
    
    settings = relationship("InstituteSettings", back_populates="institute", uselist=False, cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), index=True, nullable=False)
    description = Column(String(255), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('institute_id', 'name', name='uq_institute_role_name'),
    )

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="roles")

class User(Base):
    __tablename__ = "users"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True, index=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="refresh_tokens")

# Junction table for Course and Teacher (Many-to-Many)
course_teachers = Table(
    "course_teachers",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
)

# Junction table for Student and Course (Many-to-Many)
student_courses = Table(
    "student_courses",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
)

# Junction table for Course and Book (Many-to-Many)
course_books = Table(
    "course_books",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
)

class Course(Base):
    __tablename__ = "courses"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True, index=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    thumbnail_url = Column(String(255), nullable=True)
    course_type = Column(String(50), default="Online") # Online, Offline, Hybrid
    visibility = Column(String(50), default="Public") # Public, Private
    status = Column(String(50), default="Draft") # Draft, Published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    batches = relationship("Batch", back_populates="course", cascade="all, delete-orphan")
    teachers = relationship("User", secondary=course_teachers)
    students = relationship("Student", secondary=student_courses, back_populates="courses")
    live_classes = relationship("LiveClass", back_populates="course", cascade="all, delete-orphan")
    study_materials = relationship("StudyMaterial", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="course", cascade="all, delete-orphan")
    webinars = relationship("Webinar", back_populates="course", cascade="all, delete-orphan")
    books = relationship("Book", secondary=course_books, back_populates="courses")

class Batch(Base):
    __tablename__ = "batches"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True, index=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    course = relationship("Course", back_populates="batches")
    live_classes = relationship("LiveClass", back_populates="batch", cascade="all, delete-orphan")
    study_materials = relationship("StudyMaterial", back_populates="batch", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="batch", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="batch", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True, index=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    performance = Column(String(50), default="Good")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    courses = relationship("Course", secondary=student_courses, back_populates="students")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    task_submissions = relationship("TaskSubmission", back_populates="student", cascade="all, delete-orphan")

class LiveClass(Base):
    __tablename__ = "live_classes"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True, index=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    meeting_provider = Column(String(50), default="zoom") # zoom, google_meet, custom
    meeting_link = Column(String(255), nullable=True)
    status = Column(String(50), default="upcoming") # upcoming, live, completed, cancelled
    recording_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="live_classes")
    batch = relationship("Batch", back_populates="live_classes")
    teacher = relationship("User")
    attendance = relationship("LiveClassAttendance", back_populates="live_class", cascade="all, delete-orphan")

class LiveClassAttendance(Base):
    __tablename__ = "live_class_attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    live_class_id = Column(Integer, ForeignKey("live_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False) # present, absent, late
    marked_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    
    live_class = relationship("LiveClass", back_populates="attendance")
    student = relationship("Student")

class Book(Base):
    __tablename__ = "books"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    author = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    file_url = Column(String(255), nullable=False)
    status = Column(String(50), default="draft") # draft, published
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    courses = relationship("Course", secondary=course_books, back_populates="books")

class StudyMaterial(Base):
    __tablename__ = "study_materials"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    file_url = Column(String(255), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    material_type = Column(String(50), default="Notes") # Slides, Notes, Video, Syllabus
    visibility = Column(String(50), default="public") # public, private
    status = Column(String(50), default="draft") # draft, published
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="study_materials")
    batch = relationship("Batch", back_populates="study_materials")

class Quiz(Base):
    __tablename__ = "quizzes"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    duration_minutes = Column(Integer, default=30)
    total_marks = Column(Integer, default=100)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="draft") # draft, published, closed
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="quizzes")
    batch = relationship("Batch", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(String(255), nullable=False)
    question_type = Column(String(50), default="multiple_choice")
    marks = Column(Integer, default=5)
    
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan")

class QuizOption(Base):
    __tablename__ = "quiz_options"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False)
    
    question = relationship("QuizQuestion", back_populates="options")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Integer, default=0)
    status = Column(String(50), default="ongoing") # ongoing, submitted
    
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("Student", back_populates="quiz_attempts")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_id = Column(Integer, ForeignKey("quiz_options.id", ondelete="CASCADE"), nullable=False)
    
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion")
    selected_option = relationship("QuizOption")

class Task(Base):
    __tablename__ = "tasks"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(1000), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="draft") # draft, published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="tasks")
    batch = relationship("Batch", back_populates="tasks")
    teacher = relationship("User")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")
    submissions = relationship("TaskSubmission", back_populates="task", cascade="all, delete-orphan")

class TaskAttachment(Base):
    __tablename__ = "task_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=False)
    
    task = relationship("Task", back_populates="attachments")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    file_url = Column(String(255), nullable=False)
    status = Column(String(50), default="pending") # pending, graded
    grade = Column(String(50), nullable=True)
    feedback = Column(String(500), nullable=True)
    
    task = relationship("Task", back_populates="submissions")
    student = relationship("Student", back_populates="task_submissions")

class Webinar(Base):
    __tablename__ = "webinars"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    speaker_name = Column(String(100), nullable=False)
    speaker_details = Column(String(255), nullable=True)
    meeting_provider = Column(String(50), default='zoom')
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    meeting_url = Column(String(255), nullable=True)
    status = Column(String(50), default="upcoming") # upcoming, live, completed, cancelled
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship("Course", back_populates="webinars")
    participants = relationship("WebinarParticipant", back_populates="webinar", cascade="all, delete-orphan")

class WebinarParticipant(Base):
    __tablename__ = "webinar_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    webinar_id = Column(Integer, ForeignKey("webinars.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    webinar = relationship("Webinar", back_populates="participants")
    student = relationship("Student")

class Lead(Base):
    __tablename__ = "leads"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    course_interest = Column(String(100), nullable=True)
    source = Column(String(100), nullable=True)
    status = Column(String(50), default="New") # New, Contacted, Follow-up, Converted, Lost
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    inquiry_date = Column(DateTime(timezone=True), server_default=func.now())
    last_followup = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String(500), nullable=True)
    
    followups = relationship("LeadFollowup", back_populates="lead", cascade="all, delete-orphan")
    assigned_teacher = relationship("User")

class LeadFollowup(Base):
    __tablename__ = "lead_followups"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    note = Column(String(500), nullable=False)
    followup_date = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    lead = relationship("Lead", back_populates="followups")

class NewsfeedPost(Base):
    __tablename__ = "newsfeed_posts"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=True)
    content = Column(String(1000), nullable=False)
    type = Column(String(50), default="general") # general, announcement, educational
    file_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    author = relationship("User")
    attachments = relationship("NewsfeedAttachment", back_populates="post", cascade="all, delete-orphan")

class NewsfeedAttachment(Base):
    __tablename__ = "newsfeed_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("newsfeed_posts.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=False)
    
    post = relationship("NewsfeedPost", back_populates="attachments")

class ChatConversation(Base):
    __tablename__ = "chat_conversations"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    participants = relationship("ChatParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    conversation = relationship("ChatConversation", back_populates="participants")
    user = relationship("User")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_text = Column(String(1000), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("ChatConversation", back_populates="messages")
    sender = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(String(255), nullable=False)
    notification_type = Column(String(50), nullable=False) # Live Class, Attendance, Quiz, Task, Student Activity, Admin Message, System Notification
    redirect_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user_notifications = relationship("UserNotification", back_populates="notification", cascade="all, delete-orphan")

class UserNotification(Base):
    __tablename__ = "user_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    notification = relationship("Notification", back_populates="user_notifications")
    user = relationship("User")

class CourseActivity(Base):
    __tablename__ = "course_activities"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    student_name = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)
    detail = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    course = relationship("Course")
    student = relationship("Student")



class PrerecordedModule(Base):
    __tablename__ = 'prerecorded_modules'
    institute_id = Column(Integer, ForeignKey('institutes.id', ondelete='CASCADE'), nullable=True)
    institute = relationship('Institute')
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(String(50), default='Draft') # Draft, Published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    course = relationship('Course')
    lectures = relationship('Lecture', back_populates='module', cascade='all, delete-orphan')

class Lecture(Base):
    __tablename__ = 'lectures'
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey('prerecorded_modules.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    ordering = Column(Integer, default=0)
    status = Column(String(50), default='Draft') # Draft, Published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    module = relationship('PrerecordedModule', back_populates='lectures')

class Consultation(Base):
    __tablename__ = "consultations"
    institute_id = Column(Integer, ForeignKey("institutes.id", ondelete="CASCADE"), nullable=True)
    institute = relationship("Institute")
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    consultant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    duration_minutes = Column(Integer, default=30)
    pricing = Column(Float, default=0.0)
    status = Column(String(50), default="active") # active, inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    consultant = relationship("User")
    slots = relationship("ConsultationSlot", back_populates="consultation", cascade="all, delete-orphan")

class ConsultationSlot(Base):
    __tablename__ = "consultation_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="available") # available, booked
    
    consultation = relationship("Consultation", back_populates="slots")
    booking = relationship("ConsultationBooking", back_populates="slot", uselist=False, cascade="all, delete-orphan")

class ConsultationBooking(Base):
    __tablename__ = "consultation_bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("consultation_slots.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    booking_status = Column(String(50), default="confirmed") # confirmed, cancelled
    payment_status = Column(String(50), default="pending") # pending, paid
    amount_paid = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    slot = relationship("ConsultationSlot", back_populates="booking")
    student = relationship("Student")

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    student_id = Column(Integer, ForeignKey('students.id'))
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True) # or product_id
    amount = Column(Float)
    currency = Column(String, default="INR")
    payment_gateway = Column(String) # razorpay, paypal, manual
    payment_status = Column(String) # pending, successful, failed, refunded
    transaction_date = Column(DateTime, default=datetime.utcnow)
    invoice_reference_id = Column(String, unique=True, index=True)

class CertificateTemplate(Base):
    __tablename__ = 'certificate_templates'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    name = Column(String)
    title = Column(String)
    body_text = Column(String)
    logo_url = Column(String, nullable=True)
    signature_url = Column(String, nullable=True)
    layout = Column(String, default="standard")
    status = Column(String, default="active") # active, inactive

class CertificateRecord(Base):
    __tablename__ = 'certificate_records'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    student_id = Column(Integer, ForeignKey('students.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    template_id = Column(Integer, ForeignKey('certificate_templates.id'))
    issue_date = Column(DateTime, default=datetime.utcnow)
    certificate_number = Column(String, unique=True, index=True)
    status = Column(String, default="issued") # draft, issued, revoked
    
    student = relationship("Student")
    course = relationship("Course")
    template = relationship("CertificateTemplate")

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    user1_id = Column(Integer, ForeignKey('users.id'))
    user2_id = Column(Integer, ForeignKey('users.id'))
    last_message_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id', ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey('users.id'))
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_by_sender = Column(Boolean, default=False)

class InstituteIntegration(Base):
    __tablename__ = 'institute_integrations'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    provider_type = Column(String) # email, whatsapp, razorpay, paypal
    provider_name = Column(String) # e.g. sendgrid, twilio
    credentials_json = Column(Text) # encrypted JSON
    status = Column(String, default="Not Configured") # Not Configured, Configured, Verified, Active, Error
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InstituteBillingConfig(Base):
    __tablename__ = 'institute_billing_configs'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    gst_enabled = Column(Boolean, default=False)
    gst_number = Column(String, nullable=True)
    legal_business_name = Column(String, nullable=True)
    billing_address = Column(Text, nullable=True)
    tax_percentage = Column(Float, default=0.0)
    invoice_prefix = Column(String, default="INV-")
    next_invoice_number = Column(Integer, default=1)
    currency = Column(String, default="USD")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    invoice_number = Column(String, unique=True, index=True)
    student_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_reference = Column(String, nullable=True)
    status = Column(String, default="Paid") # Paid, Refunded, Failed
    issue_date = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])
    transaction = relationship("Transaction", foreign_keys=[transaction_id])

class Workflow(Base):
    __tablename__ = 'workflows'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    name = Column(String)
    trigger_event = Column(String) # Lead Created, Student Enrolled, Payment Successful, Course Access Required, Certificate Eligible, Notification Scheduled
    is_active = Column(Boolean, default=True)
    conditions = Column(String, default="[]") # JSON list of conditions
    created_at = Column(DateTime, default=datetime.utcnow)
    
    actions = relationship("WorkflowAction", back_populates="workflow", cascade="all, delete-orphan")
    logs = relationship("WorkflowExecutionLog", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowAction(Base):
    __tablename__ = 'workflow_actions'
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey('workflows.id'))
    action_type = Column(String) # Create Enrollment, Grant Course Access, Send Email, Send Notification, Create Certificate Record, Update Lead Status
    action_payload = Column(String, default="{}") # JSON config for the action
    order_index = Column(Integer, default=0)
    
    workflow = relationship("Workflow", back_populates="actions")

class WorkflowExecutionLog(Base):
    __tablename__ = 'workflow_execution_logs'
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey('workflows.id'))
    trigger_payload = Column(String, default="{}") # JSON
    status = Column(String) # Success, Failed, Pending
    error_message = Column(String, nullable=True)
    execution_date = Column(DateTime, default=datetime.utcnow)
    
    workflow = relationship("Workflow", back_populates="logs")

class ReportHistory(Base):
    __tablename__ = 'report_history'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    report_type = Column(String) # User, Course, Enrollment, Transaction, Lead, Learning Activity, Certificate
    status = Column(String, default="Processing") # Processing, Completed, Failed
    file_url = Column(String, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

class InstitutePlanAddon(Base):
    __tablename__ = 'institute_plan_addons'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'))
    addon_name = Column(String) # 'On Domain', 'Android & iOS App', 'Nrich Lead Management', 'WhatsApp', 'Zoom SDK', 'WordPress'
    status = Column(String, default="Inactive") # Active, Inactive
    activation_date = Column(DateTime, nullable=True)

class InstituteSettings(Base):
    __tablename__ = 'institute_settings'
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey('institutes.id'), unique=True)
    
    # Class / Integrations
    header_logo = Column(String, nullable=True)
    share_zoom_recordings = Column(Boolean, default=False)
    min_attendance_percentage = Column(Integer, default=75)
    enable_student_feedback = Column(Boolean, default=True)
    country = Column(String, default="India")
    time_zone = Column(String, default="Asia/Kolkata")
    
    # Chat & Social Connect
    chat_enabled = Column(Boolean, default=True)
    disappearing_chats_enabled = Column(Boolean, default=False)
    allow_message_deletion = Column(Boolean, default=True)
    allow_student_posts = Column(Boolean, default=False)
    allow_student_comments = Column(Boolean, default=True)
    
    # Security & Fairness
    hide_student_info_from_teachers = Column(Boolean, default=False)
    restrict_teacher_content_visibility = Column(Boolean, default=True)
    allow_study_material_download = Column(Boolean, default=True)
    require_live_class_approval = Column(Boolean, default=False)
    allow_book_download = Column(Boolean, default=False)
    strict_quiz_timing = Column(Boolean, default=True)
    strict_assignment_deadlines = Column(Boolean, default=True)
    
    institute = relationship("Institute", back_populates="settings")
