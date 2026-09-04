import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("backend"))
from app.main import app

client = TestClient(app)

print("--- 1. TESTING AUTH WORKFLOW ---")
# Admin login
res_admin = client.post("/api/auth/institute/login", json={"username_or_email": "admin@kite.lms", "password": "password123"})
print(f"Admin Login status: {res_admin.status_code}")
assert res_admin.status_code == 200
admin_token = res_admin.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Teacher login
res_teacher = client.post("/api/auth/login", json={"username_or_email": "teacher@kite.lms", "password": "password123"})
print(f"Teacher Login status: {res_teacher.status_code}")
assert res_teacher.status_code == 200
teacher_token = res_teacher.json()["access_token"]
teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

# Student login
res_student = client.post("/api/auth/login", json={"username_or_email": "student@kite.lms", "password": "password123"})
print(f"Student Login status: {res_student.status_code}")
assert res_student.status_code == 200
student_token = res_student.json()["access_token"]
student_headers = {"Authorization": f"Bearer {student_token}"}


print("\n--- 2. TESTING WORKFLOWS & AUTOMATION ENGINE ---")
# Get workflows
res_wf = client.get("/api/institute-admin/workflows", headers=admin_headers)
print(f"Get Workflows status: {res_wf.status_code}, count: {len(res_wf.json())}")
assert res_wf.status_code == 200
wfs = res_wf.json()
wf_id = wfs[0]["id"] if wfs else None

# Toggle workflow
if wf_id:
    res_toggle = client.put(f"/api/institute-admin/workflows/{wf_id}/toggle", headers=admin_headers)
    print(f"Toggle Workflow status: {res_toggle.status_code}, payload: {res_toggle.json()}")
    assert res_toggle.status_code == 200
    
    # Test trigger workflow
    res_test = client.post(f"/api/institute-admin/workflows/{wf_id}/test", headers=admin_headers)
    print(f"Test Trigger Workflow status: {res_test.status_code}, payload: {res_test.json()}")
    assert res_test.status_code == 200

# Get workflow logs
res_logs = client.get("/api/institute-admin/workflows/logs", headers=admin_headers)
print(f"Get Workflow Logs status: {res_logs.status_code}, count: {len(res_logs.json())}")
assert res_logs.status_code == 200


print("\n--- 3. TESTING CRM & AUTOMATED WORKFLOW TRIGGERS ---")
# Create CRM lead (triggers "Lead Created" workflow)
res_lead = client.post("/api/institute-admin/crm/leads", json={
    "name": "Test Prospect",
    "phone": "+1-555-9988",
    "status": "New",
    "source": "Meta Ads"
}, headers=admin_headers)
print(f"Create CRM Lead status: {res_lead.status_code}")
assert res_lead.status_code == 200
lead_id = res_lead.json()["id"]

# Add followup (triggers "Lead Follow-up Due" workflow)
res_followup = client.post(f"/api/institute-admin/crm/leads/{lead_id}/followups", json={
    "notes": "Sent program prospectus via Email",
    "status": "Completed"
}, headers=admin_headers)
print(f"Create Lead Followup status: {res_followup.status_code}")
assert res_followup.status_code == 200

# Enroll lead (triggers "Student Enrolled" and "Course Access Required" workflows)
res_enroll = client.post(f"/api/institute-admin/crm/leads/{lead_id}/enroll", headers=admin_headers)
print(f"Enroll Lead status: {res_enroll.status_code}, detail: {res_enroll.json()['detail']}")
assert res_enroll.status_code == 200


print("\n--- 4. TESTING STUDENT PORTAL WORKFLOWS ---")
res_st_dash = client.get("/api/student/dashboard", headers=student_headers)
print(f"Student Dashboard status: {res_st_dash.status_code}")
assert res_st_dash.status_code == 200

res_st_courses = client.get("/api/student/courses", headers=student_headers)
print(f"Student Courses status: {res_st_courses.status_code}, count: {len(res_st_courses.json())}")
assert res_st_courses.status_code == 200

res_st_live = client.get("/api/student/live-classes", headers=student_headers)
print(f"Student Live Classes status: {res_st_live.status_code}")
assert res_st_live.status_code == 200

res_st_quizzes = client.get("/api/student/quizzes", headers=student_headers)
print(f"Student Quizzes status: {res_st_quizzes.status_code}")
assert res_st_quizzes.status_code == 200

res_st_tasks = client.get("/api/student/tasks", headers=student_headers)
print(f"Student Tasks status: {res_st_tasks.status_code}")
assert res_st_tasks.status_code == 200

res_st_mats = client.get("/api/student/materials", headers=student_headers)
print(f"Student Materials status: {res_st_mats.status_code}")
assert res_st_mats.status_code == 200

res_st_certs = client.get("/api/student/certificates", headers=student_headers)
print(f"Student Certificates status: {res_st_certs.status_code}")
assert res_st_certs.status_code == 200

print("\n--- ALL WORKFLOW TESTS PASSED SUCCESSFULLY! ---")
