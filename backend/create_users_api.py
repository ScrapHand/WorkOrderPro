import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

def setup():
    # 1. Login
    print("Logging in...")
    login_data = {"username": "admin@demo.com", "password": "password"}
    # Endpoint is /auth/login NOT /auth/access-token
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data, headers=HEADERS)
    if r.status_code != 200:
        print(f"Login Failed: {r.text}")
        return
    token = r.json()["access_token"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    print("Logged in.")

    # 2. Create Users
    users = [
        {"email": "manager@test.com", "full_name": "Manager Test", "role": "manager", "password": "password"},
        {"email": "engineer@test.com", "full_name": "Engineer Test", "role": "engineer", "password": "password"}
    ]

    for u in users:
        print(f"Creating {u['email']}...")
        r = requests.post(f"{BASE_URL}/users/", json=u, headers=auth_headers)
        if r.status_code == 200:
            print("Success.")
        elif r.status_code == 400 and "already exists" in r.text:
            print("User already exists.")
        else:
            print(f"Failed: {r.text}")

if __name__ == "__main__":
    setup()
