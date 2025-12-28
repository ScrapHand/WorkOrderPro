import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

def inspect():
    # Login
    print("Logging in...")
    r = requests.post(f"{BASE_URL}/auth/login", data={"username": "manager@test.com", "password": "password"}, headers=HEADERS)
    if r.status_code != 200:
        print("Login Failed")
        return
    token = r.json()["access_token"]
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    # Fetch Assets
    print("Fetching Assets...")
    r = requests.get(f"{BASE_URL}/assets/", headers=headers)
    if r.status_code == 200:
        assets = r.json()
        print(json.dumps(assets, indent=2))
    else:
        print(f"Failed: {r.status_code} {r.text}")

if __name__ == "__main__":
    inspect()
