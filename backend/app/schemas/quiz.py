from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QuizOptionBase(BaseModel):
    option_text: str
    is_correct: bool = False

class QuizOptionCreate(QuizOptionBase):
    pass

class QuizOptionResponse(QuizOptionBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True

class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    marks: int = 5

class QuizQuestionCreate(QuizQuestionBase):
    options: List[QuizOptionCreate] = []

class QuizQuestionResponse(QuizQuestionBase):
    id: int
    quiz_id: int
    options: List[QuizOptionResponse] = []

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    batch_id: Optional[int] = None
    duration_minutes: int = 30
    total_marks: int = 100
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = "draft"

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[int] = None
    batch_id: Optional[int] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class QuizResponse(QuizBase):
    id: int
    institute_id: Optional[int] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    course_title: Optional[str] = None
    batch_name: Optional[str] = None
    question_count: Optional[int] = 0
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True
