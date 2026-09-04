import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://localhost:8000"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            status_code = response.getcode()
            json_data = json.loads(res_body) if res_body else {}
            return status_code, json_data
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(res_body)
        except Exception:
            err_json = {"raw": res_body}
        return e.code, err_json

print("==================================================")
print("1. TESTING AUTHENTICATION FOR ALL 4 ROLES")
print("==================================================")

# Platform Admin Login
status, data = request("POST", "/api/auth/login", {"username_or_email": "platformadmin@kite.lms", "password": "password123"})
print(f"Platform Admin Login: {status}")
assert status == 200, f"Platform Admin login failed: {data}"
platform_token = data["access_token"]

# Institute Admin Login
status, data = request("POST", "/api/auth/institute/login", {"username_or_email": "instituteadmin@kite.lms", "password": "password123"})
print(f"Institute Admin Login: {status}")
assert status == 200, f"Institute Admin login failed: {data}"
institute_token = data["access_token"]

# Teacher Login
status, data = request("POST", "/api/auth/login", {"username_or_email": "teacher@kite.lms", "password": "password123"})
print(f"Teacher Login: {status}")
assert status == 200, f"Teacher login failed: {data}"
teacher_token = data["access_token"]

# Student Login
status, data = request("POST", "/api/auth/login", {"username_or_email": "student@kite.lms", "password": "password123"})
print(f"Student Login: {status}")
assert status == 200, f"Student login failed: {data}"
student_token = data["access_token"]

print("\n==================================================")
print("2. TESTING INSTITUTE ADMIN USER MANAGEMENT")
print("==================================================")

# GET Users
status, users = request("GET", "/api/institute-admin/users", token=institute_token)
print(f"GET /api/institute-admin/users: status {status}, users count: {len(users)}")
assert status == 200

# CREATE User
rnd_id = uuid.uuid4().hex[:6]
new_user_payload = {
    "first_name": "Test",
    "last_name": f"Teacher_{rnd_id}",
    "email": f"teacher_{rnd_id}@kite.lms",
    "phone": "+1-555-9876",
    "role": "teacher",
    "password": "password123",
    "status": "active"
}
status, created_user = request("POST", "/api/institute-admin/users", new_user_payload, token=institute_token)
print(f"POST /api/institute-admin/users: status {status}, user_id: {created_user.get('id')}")
assert status == 200
user_id = created_user["id"]

# UPDATE User Status (PATCH)
status, patch_res = request("PATCH", f"/api/institute-admin/users/{user_id}/status", {"is_active": False}, token=institute_token)
print(f"PATCH /api/institute-admin/users/{user_id}/status: status {status}, is_active: {patch_res.get('is_active')}")
assert status == 200
assert patch_res["is_active"] is False

# SEARCH Users
status, search_res = request("GET", f"/api/institute-admin/users?role=teacher&search={rnd_id}", token=institute_token)
print(f"GET Search users: status {status}, matched count: {len(search_res)}")
assert status == 200
assert len(search_res) >= 1

print("\n==================================================")
print("3. TESTING WORKFLOWS & AUTOMATION ENGINE")
print("==================================================")

status, workflows = request("GET", "/api/institute-admin/workflows", token=institute_token)
print(f"GET Workflows: status {status}, count: {len(workflows)}")
assert status == 200

if workflows:
    wf_id = workflows[0]["id"]
    status, toggle_res = request("PUT", f"/api/institute-admin/workflows/{wf_id}/toggle", token=institute_token)
    print(f"Toggle Workflow {wf_id}: status {status}")
    assert status == 200

    status, test_res = request("POST", f"/api/institute-admin/workflows/{wf_id}/test", token=institute_token)
    print(f"Test Workflow {wf_id}: status {status}")
    assert status == 200

status, logs = request("GET", "/api/institute-admin/workflows/logs", token=institute_token)
print(f"GET Workflow Logs: status {status}, logs count: {len(logs)}")
assert status == 200

print("\n==================================================")
print("4. TESTING BILLING & INVOICING CONFIG")
print("==================================================")

status, config = request("GET", "/api/institute-admin/billing/config", token=institute_token)
print(f"GET Billing Config: status {status}, currency: {config.get('currency')}")
assert status == 200

status, invoices = request("GET", "/api/institute-admin/billing/invoices", token=institute_token)
print(f"GET Invoices: status {status}, invoices count: {len(invoices)}")
assert status == 200

print("\n==================================================")
print("5. TESTING CRM & LEADS MANAGEMENT")
print("==================================================")

status, crm_stats = request("GET", "/api/institute-admin/crm/dashboard-stats", token=institute_token)
print(f"GET CRM Stats: status {status}, total_leads: {crm_stats.get('total_leads')}")
assert status == 200

status, crm_leads = request("GET", "/api/institute-admin/crm/leads", token=institute_token)
print(f"GET CRM Leads: status {status}, leads count: {len(crm_leads)}")
assert status == 200

print("\n==================================================")
print("6. TESTING TRANSACTIONS & MONTHLY SUMMARY")
print("==================================================")

status, tx_list = request("GET", "/api/institute-admin/transactions", token=institute_token)
print(f"GET /api/institute-admin/transactions: status {status}, count: {len(tx_list)}")
assert status == 200

status, monthly_sum = request("GET", "/api/institute-admin/transactions/monthly-summary", token=institute_token)
print(f"GET /api/institute-admin/transactions/monthly-summary: status {status}, summary: {monthly_sum}")
assert status == 200
assert isinstance(monthly_sum, list)

print("\n==================================================")
print("7. TESTING TEACHER & STUDENT PORTAL ENDPOINTS")
print("==================================================")

# Teacher Dashboard & Courses
status, t_dash = request("GET", "/api/teacher/dashboard", token=teacher_token)
print(f"GET /api/teacher/dashboard: status {status}")
assert status == 200

status, t_courses = request("GET", "/api/teacher/courses", token=teacher_token)
print(f"GET /api/teacher/courses: status {status}, count: {len(t_courses)}")
assert status == 200

# Student Dashboard & Courses
status, s_dash = request("GET", "/api/student/dashboard", token=student_token)
print(f"GET /api/student/dashboard: status {status}")
assert status == 200

status, s_courses = request("GET", "/api/student/courses", token=student_token)
print(f"GET /api/student/courses: status {status}, count: {len(s_courses)}")
assert status == 200

status, s_certs = request("GET", "/api/student/certificates", token=student_token)
print(f"GET /api/student/certificates: status {status}, count: {len(s_certs)}")
assert status == 200

print("\n==================================================")
print("ALL SYSTEM & WORKFLOW VERIFICATION TESTS PASSED 100%!")
print("==================================================")
