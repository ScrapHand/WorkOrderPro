import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

print("=== Testing Work Order Creation ===")

# 1. Login
print("1. Logging in...")
r = requests.post(f"{BASE_URL}/auth/login", 
                 data={"username": "manager@test.com", "password": "password"}, 
                 headers=HEADERS)
if r.status_code != 200:
    print(f"❌ Login Failed: {r.text}")
    exit(1)
token = r.json()["access_token"]
headers = {**HEADERS, "Authorization": f"Bearer {token}"}
print("✅ Login successful")

# 2. Get an Asset ID (to link)
print("2. Fetching assets...")
r = requests.get(f"{BASE_URL}/assets/", headers=headers)
assets = r.json()
if not assets:
    print("❌ No assets found! Create one first.")
    exit(1)
asset_id = assets[0]["id"]
print(f"✅ Found asset: {assets[0]['name']} ({asset_id})")

# 3. Create Work Order
print("3. Creating Work Order...")
wo_data = {
    "title": "API Verification Job",
    "description": "Created via python script to verify backend.",
    "priority": "high",
    "status": "new",
    "asset_id": asset_id
}

r = requests.post(f"{BASE_URL}/work-orders/", json=wo_data, headers=headers)
if r.status_code == 200:
    print("✅ Work Order Created Successfully!")
    print(f"   ID: {r.json()['id']}")
    print(f"   Title: {r.json()['title']}")
else:
    print(f"❌ Failed to create WO: {r.status_code}")
    print(f"   Response: {r.text}")
