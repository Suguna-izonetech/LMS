import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("backend"))
from app.main import app

client = TestClient(app)

print("--- TESTING ALL 4 UNIQUE LOGINS ---")

# 1. Platform Admin Login
res_pa = client.post("/api/auth/login", json={"username_or_email": "platformadmin@kite.lms", "password": "password123"})
print(f"Platform Admin (by email) Login status: {res_pa.status_code}")
assert res_pa.status_code == 200
pa_token = res_pa.json()["access_token"]
me_pa = client.get("/api/auth/me", headers={"Authorization": f"Bearer {pa_token}"}).json()
print(f"  -> Roles: {[r['name'] for r in me_pa['roles']]}")
assert any(r['name'].lower() == 'admin' for r in me_pa['roles'])

res_pa_user = client.post("/api/auth/login", json={"username_or_email": "platform_admin", "password": "password123"})
print(f"Platform Admin (by username) Login status: {res_pa_user.status_code}")
assert res_pa_user.status_code == 200

# 2. Institute Admin Login
res_ia = client.post("/api/auth/institute/login", json={"username_or_email": "instituteadmin@kite.lms", "password": "password123"})
print(f"Institute Admin (by email) Login status: {res_ia.status_code}")
assert res_ia.status_code == 200
ia_token = res_ia.json()["access_token"]
me_ia = client.get("/api/auth/me", headers={"Authorization": f"Bearer {ia_token}"}).json()
print(f"  -> Roles: {[r['name'] for r in me_ia['roles']]}")
assert any(r['name'].lower() == 'instituteadmin' for r in me_ia['roles'])

res_ia_user = client.post("/api/auth/institute/login", json={"username_or_email": "institute_admin", "password": "password123"})
print(f"Institute Admin (by username) Login status: {res_ia_user.status_code}")
assert res_ia_user.status_code == 200

# 3. Teacher Login
res_tea = client.post("/api/auth/login", json={"username_or_email": "teacher@kite.lms", "password": "password123"})
print(f"Teacher Login status: {res_tea.status_code}")
assert res_tea.status_code == 200
tea_token = res_tea.json()["access_token"]
me_tea = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tea_token}"}).json()
print(f"  -> Roles: {[r['name'] for r in me_tea['roles']]}")
assert any(r['name'].lower() == 'teacher' for r in me_tea['roles'])

# 4. Student Login
res_stu = client.post("/api/auth/login", json={"username_or_email": "student@kite.lms", "password": "password123"})
print(f"Student Login status: {res_stu.status_code}")
assert res_stu.status_code == 200
stu_token = res_stu.json()["access_token"]
me_stu = client.get("/api/auth/me", headers={"Authorization": f"Bearer {stu_token}"}).json()
print(f"  -> Roles: {[r['name'] for r in me_stu['roles']]}")
assert any(r['name'].lower() == 'student' for r in me_stu['roles'])

print("\n--- ALL 4 UNIQUE LOGINS VERIFIED AND WORKING PERFECTLY! ---")
