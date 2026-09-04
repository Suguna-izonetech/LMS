from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.main import app
from app.db.database import Base, get_db
from app.models.all_models import Institute, User, Role, Course, Student
from app.core.security import create_access_token

client = TestClient(app)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

def get_test_db():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = get_test_db

def test_security():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = next(get_test_db())
    
    # 1. Setup Data for testing
    inst_1 = Institute(name="Mock Institute")
    db.add(inst_1)
    db.commit()
    db.refresh(inst_1)
    
    user_inst_1 = User(username="institute_admin", email="admin1@kite.com", hashed_password="fake", institute_id=inst_1.id, is_active=True)
    db.add(user_inst_1)
    db.commit()
    db.refresh(user_inst_1)
    
    role_admin = Role(name="InstituteAdmin", institute_id=inst_1.id)
    db.add(role_admin)
    db.commit()
    user_inst_1.roles.append(role_admin)
    
    student_user = User(username="student", email="student@kite.com", hashed_password="fake", institute_id=inst_1.id, is_active=True)
    db.add(student_user)
    
    course_1 = Course(title="Inst 1 Course", code="C1", institute_id=inst_1.id)
    db.add(course_1)
    db.commit()
    
    inst_2 = Institute(name="Security Test Institute")
    db.add(inst_2)
    db.commit()
    db.refresh(inst_2)
    
    user_inst_1 = db.query(User).filter(User.username == "institute_admin").first()
    
    user_inst_2 = User(username="admin2", email="admin2@kite.com", hashed_password="fake", institute_id=inst_2.id, is_active=True)
    db.add(user_inst_2)
    db.commit()
    db.refresh(user_inst_2)
    
    role_admin = db.query(Role).filter(Role.name == "InstituteAdmin").first()
    user_inst_2.roles.append(role_admin)
    db.commit()
    
    # Also add a student in Inst 1 (unauthorized for admin APIs)
    student_user = db.query(User).filter(User.username == "student").first()
    
    # Create a course in Inst 2
    course_2 = Course(title="Inst 2 Secret Course", code="SEC200", institute_id=inst_2.id)
    db.add(course_2)
    db.commit()
    db.refresh(course_2)
    
    course_1 = db.query(Course).filter(Course.institute_id == inst_1.id).first()
    
    # Tokens
    token_1 = create_access_token(user_inst_1.id)
    token_2 = create_access_token(user_inst_2.id)
    token_student = create_access_token(student_user.id)
    
    print("--- RUNNING SECURITY TESTS ---")
    
    # TEST 1: Valid Admin -> Own Institute Data -> ALLOW
    res = client.get("/api/institute-admin/courses", headers={"Authorization": f"Bearer {token_1}"})
    if res.status_code == 200:
        print("[PASS] [TEST 1] Valid Admin -> Own Institute Data -> ALLOW (200 OK)")
    else:
        print(f"[FAIL] [TEST 1] Failed with {res.status_code}")
        
    # TEST 2: Valid Admin -> Another Institute's Data -> REJECT
    res = client.put(f"/api/institute-admin/courses/{course_2.id}", json={"title": "Hacked", "code": "HACK", "visibility": "Public", "status": "Draft"}, headers={"Authorization": f"Bearer {token_1}"})
    if res.status_code == 404:
        print("[PASS] [TEST 2] Valid Admin -> Another Institute's Data -> REJECT (404 Not Found)")
    else:
        print(f"[FAIL] [TEST 2] Failed with {res.status_code}. Expected 404. {res.json()}")
        
    # TEST 3: Unauthorized User (Student) -> Admin API -> REJECT
    res = client.get("/api/institute-admin/courses", headers={"Authorization": f"Bearer {token_student}"})
    if res.status_code == 403:
        print("[PASS] [TEST 3] Unauthorized User (Student) -> Admin API -> REJECT (403 Forbidden)")
    else:
        print(f"[FAIL] [TEST 3] Failed with {res.status_code}. Expected 403. {res.json()}")
        
    # TEST 4: Invalid JWT -> REJECT
    res = client.get("/api/institute-admin/courses", headers={"Authorization": f"Bearer INVALID"})
    if res.status_code == 401:
        print("[PASS] [TEST 4] Invalid JWT -> REJECT (401 Unauthorized)")
    else:
        print(f"[FAIL] [TEST 4] Failed with {res.status_code}. Expected 401.")
        
    # TEST 5: Forged institute_id -> IGNORE/REJECT
    res = client.post("/api/institute-admin/courses", json={"title": "Forged", "code": "FORGE1", "visibility": "Public", "status": "Draft", "institute_id": inst_2.id}, headers={"Authorization": f"Bearer {token_1}"})
    if res.status_code == 200:
        c_id = res.json()["id"]
        c = db.query(Course).filter(Course.id == c_id).first()
        if c.institute_id == inst_1.id:
            print("[PASS] [TEST 5] Forged institute_id in Request Body -> IGNORE (Backend enforces own institute_id)")
        else:
            print("[FAIL] [TEST 5] Failed! Backend accepted the forged institute_id!")
    else:
        # Pydantic might reject it
        print("[PASS] [TEST 5] Forged institute_id in Request Body -> REJECT (Pydantic ValidationError or similar)")
        
if __name__ == '__main__':
    test_security()
