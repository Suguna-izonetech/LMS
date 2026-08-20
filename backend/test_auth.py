import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
        
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode("utf-8")
            return res.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = {"detail": err_body}
        return e.code, err_json
    except Exception as e:
        print(f"Connection error: {e}")
        return 0, {"detail": str(e)}

def run_tests():
    print("==================================================")
    print("RUNNING KITE LMS AUTHENTICATION INTEGRATION TESTS")
    print("==================================================")
    
    tests_failed = 0
    
    # Test 1: Valid Teacher Login
    print("\n[TEST 1] Valid Teacher Login...")
    status, body = make_request("/auth/login", method="POST", data={
        "username_or_email": "teacher@kite.lms",
        "password": "password123"
    })
    if status == 200 and "access_token" in body and "refresh_token" in body:
        print("-> SUCCESS: Received access_token and refresh_token")
        access_token = body["access_token"]
        refresh_token = body["refresh_token"]
    else:
        print(f"-> FAILED: Status {status}, Body: {body}")
        tests_failed += 1
        access_token = None
        refresh_token = None

    # Test 2: Invalid password
    print("\n[TEST 2] Invalid Password Rejection...")
    status, body = make_request("/auth/login", method="POST", data={
        "username_or_email": "teacher@kite.lms",
        "password": "wrongpassword"
    })
    if status == 401:
        print("-> SUCCESS: Invalid password properly rejected with 401 Unauthorized")
    else:
        print(f"-> FAILED: Status {status}, Body: {body}")
        tests_failed += 1

    # Test 3: Unauthorized API request
    print("\n[TEST 3] Unauthorized API Request...")
    status, body = make_request("/auth/me", method="GET")
    if status == 401:
        print("-> SUCCESS: Access without token rejected with 401 Unauthorized")
    else:
        print(f"-> FAILED: Status {status}, Body: {body}")
        tests_failed += 1

    # Test 4: Non-Teacher access rejection
    print("\n[TEST 4] Non-Teacher Access Rejection...")
    status, body = make_request("/auth/login", method="POST", data={
        "username_or_email": "student@kite.lms",
        "password": "password123"
    })
    if status == 403:
        print("-> SUCCESS: Non-Teacher login rejected with 403 Forbidden")
    else:
        print(f"-> FAILED: Status {status}, Body: {body}")
        tests_failed += 1

    if access_token:
        # Test 5: Authenticated /me request
        print("\n[TEST 5] Authenticated /me Request...")
        status, body = make_request("/auth/me", method="GET", headers={
            "Authorization": f"Bearer {access_token}"
        })
        if status == 200 and body.get("email") == "teacher@kite.lms":
            print(f"-> SUCCESS: Retrieved profile for: {body.get('username')} ({body.get('email')})")
            print(f"   Roles: {[r.get('name') for r in body.get('roles', [])]}")
            print(f"   Permissions count: {len(body.get('permissions', []))}")
        else:
            print(f"-> FAILED: Status {status}, Body: {body}")
            tests_failed += 1
            
        # Test 6: Token Refresh
        print("\n[TEST 6] Token Refresh...")
        status, body = make_request("/auth/refresh", method="POST", data={
            "refresh_token": refresh_token
        })
        if status == 200 and "access_token" in body and "refresh_token" in body:
            print("-> SUCCESS: Token refreshed, received new access_token and refresh_token")
        else:
            print(f"-> FAILED: Status {status}, Body: {body}")
            tests_failed += 1
    else:
        print("\n[TEST 5 & 6] SKIPPED: Missing tokens from Test 1")
        tests_failed += 2

    print("\n==================================================")
    if tests_failed == 0:
        print("ALL TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print(f"{tests_failed} TESTS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
