import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

def clean():
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
        for a in assets:
            if "Asset UI Test" in a["name"] or "UI001" in a["code"] or "Asset GammaAsset" in a["name"]:
                print(f"Deleting corrupted asset: {a['name']} ({a['id']})")
                del_r = requests.delete(f"{BASE_URL}/assets/{a['id']}", headers=headers)
                print(f"  Result: {del_r.status_code}")
    
    print("Cleanup Complete.")

if __name__ == "__main__":
    clean()
