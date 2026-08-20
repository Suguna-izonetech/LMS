from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NewsfeedPostBase(BaseModel):
    title: str
    content: str
    post_type: str
    status: str

class NewsfeedPostCreate(NewsfeedPostBase):
    pass

class NewsfeedPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    post_type: Optional[str] = None
    status: Optional[str] = None

class NewsfeedPostResponse(NewsfeedPostBase):
    id: int
    institute_id: int
    author_id: int
    image_url: Optional[str] = None
    created_at: datetime
    author_name: Optional[str] = None
    likes_count: Optional[int] = 0
    comments_count: Optional[int] = 0

    class Config:
        from_attributes = True
