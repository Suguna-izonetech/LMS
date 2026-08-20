from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserRegister

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserRegister):
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        password=user.password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
