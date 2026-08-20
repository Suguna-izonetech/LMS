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

# 🔥 Change email for CEO
existing = db.query(User).filter(User.email == "ceo@cms.com").first()

if not existing:
    ceo = User(
        name="Chief Executive Officer",
        email="ceo@cms.com",
        password=hash_password("Ceo@123"),
        phone="9999999999",
        role=UserRole.CHIEF   # 🔥 THIS IS IMPORTANT
    )
    db.add(ceo)
    db.commit()
    db.refresh(ceo)

    print("✅ CEO created successfully")
    print("Email: ceo@cms.com")
    print("Password: Ceo@123")

else:
    print("ℹ️ CEO already exists:", existing.id, existing.email)

db.close()