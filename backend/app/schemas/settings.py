from pydantic import BaseModel
from typing import Optional

class UserProfileUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: str
    # role and institute_id are explicitly excluded
    # profile image is handled via form data

class InstituteProfileUpdate(BaseModel):
    name: str
    about_text: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    google_maps_link: Optional[str] = None
    seo_metadata: Optional[str] = None
    youtube_link: Optional[str] = None
    social_links: Optional[str] = None
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = None

class InstituteSettingsUpdate(BaseModel):
    header_logo: Optional[str] = None
    share_zoom_recordings: bool
    min_attendance_percentage: int
    enable_student_feedback: bool
    country: str
    time_zone: str
    
    chat_enabled: bool
    disappearing_chats_enabled: bool
    allow_message_deletion: bool
    allow_student_posts: bool
    allow_student_comments: bool
    
    hide_student_info_from_teachers: bool
    restrict_teacher_content_visibility: bool
    allow_study_material_download: bool
    require_live_class_approval: bool
    allow_book_download: bool
    strict_quiz_timing: bool
    strict_assignment_deadlines: bool

class InstituteProfileResponse(InstituteProfileUpdate):
    id: int
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class InstituteSettingsResponse(InstituteSettingsUpdate):
    id: int
    institute_id: int
    
    class Config:
        from_attributes = True
