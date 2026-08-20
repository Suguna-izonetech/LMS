from app.models.team import Team
from app.models.call import Call
from app.models.audit import AuditLog
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine

# 🔥 Import ALL models so relationships register
from app.models.user import User, UserRole
from app.models.team import Team
from app.models.call import Call
from app.models.audit import AuditLog

from passlib.context import CryptContext

# Create tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

db: Session = SessionLocal()

existing = db.query(User).filter(User.email == "manager@test.com").first()

if not existing:
    manager = User(
        name="Test Manager",
        email="manager@test.com",
        password=hash_password("Manager123"),
        phone="1234567890",
        role=UserRole.MANAGER
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    print("✅ Test manager created:", manager.id, manager.email)
else:
    print("ℹ️ Test manager already exists:", existing.id, existing.email)

db.close()