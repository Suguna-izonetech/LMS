import sys
import os
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("backend"))
from app.main import app

client = TestClient(app)

# Login as Institute Admin
res_login = client.post("/api/auth/institute/login", json={"username_or_email": "instituteadmin@kite.lms", "password": "password123"})
assert res_login.status_code == 200
token = res_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("1. Testing GET /api/institute-admin/users")
res_users = client.get("/api/institute-admin/users", headers=headers)
print(f"Status: {res_users.status_code}")
print(f"Users found: {len(res_users.json())}")
assert res_users.status_code == 200

print("2. Testing POST /api/institute-admin/users")
random_email = f"teacher_{uuid.uuid4().hex[:6]}@kite.lms"
res_create = client.post("/api/institute-admin/users", json={
    "first_name": "Sample",
    "last_name": "Instructor",
    "email": random_email,
    "phone": "+1-555-4321",
    "role": "teacher",
    "password": "password123",
    "status": "active"
}, headers=headers)
print(f"Create User status: {res_create.status_code}")
assert res_create.status_code == 200
new_uid = res_create.json()["id"]

print("3. Testing PATCH /api/institute-admin/users/{id}/status")
res_status = client.patch(f"/api/institute-admin/users/{new_uid}/status", json={"is_active": False}, headers=headers)
print(f"PATCH Update Status: {res_status.status_code}, is_active: {res_status.json()['is_active']}")
assert res_status.status_code == 200
assert res_status.json()["is_active"] is False

print("4. Testing GET /api/institute-admin/users with search & filter")
res_search = client.get(f"/api/institute-admin/users?role=teacher&search={random_email}", headers=headers)
print(f"Search status: {res_search.status_code}, count: {len(res_search.json())}")
assert res_search.status_code == 200
assert len(res_search.json()) == 1

print("\n--- ALL USER MANAGEMENT API TESTS PASSED 100%! ---")
