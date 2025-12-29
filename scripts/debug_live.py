import requests
import json
import sys

# CONFIGURATION - USER: CHANGE THIS TO YOUR LIVE API URL IF NEEDED
# Example: https://workorderpro-backend.onrender.com/api/v1
API_URL = "https://workorderpro-backend.onrender.com/api/v1" 

print(f"--- WorkOrderPro Debugger ---")
print(f"Target API: {API_URL}")

# 1. Login
print("\n[1] Attempting Login (admin@acme.com)...")
try:
    auth_data = {
        "username": "admin@acme.com", 
        "password": "ScrapHand"
    }
    # Headers for Tenant Context (REQUIRED for Login)
    login_headers = {
        "X-Tenant-Slug": "acme"
    }

    # Endpoint is /auth/login, expects FORM data
    print(f"POST {API_URL}/auth/login with headers={login_headers}")
    resp = requests.post(f"{API_URL}/auth/login", data=auth_data, headers=login_headers)
    
    if resp.status_code != 200:
        print(f"FATAL: Login Failed. Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        sys.exit(1)

    token = resp.json().get("access_token")
    print("Login Success! Token acquired.")
    
except Exception as e:
    print(f"FATAL: Connection Error: {e}")
    sys.exit(1)

# 2. Setup Headers (Token + Tenant)
headers = {
    "Authorization": f"Bearer {token}",
    "X-Tenant-Slug": "acme"
}

# 3. Fetch Users List
print("\n[3] Fetching Users List...")
try:
    users_resp = requests.get(f"{API_URL}/users/", headers=headers)
    
    print(f"Status Code: {users_resp.status_code}")
    
    if users_resp.status_code == 200:
        data = users_resp.json()
        print(f"Success! Found {len(data)} Users.")
        if len(data) > 0:
            print("Sample User 0:")
            print(json.dumps(data[0], indent=2))
    else:
        print("ERROR RESPONSE:")
        print(users_resp.text)

except Exception as e:
    print(f"Request Error: {e}")

print("\n--- End Debug ---")
