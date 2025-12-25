import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

print("=== Testing Work Order List & Stats ===")

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

# 2. Get List
print("2. Fetching Work Order List...")
r = requests.get(f"{BASE_URL}/work-orders/", headers=headers)
if r.status_code == 200:
    wos = r.json()
    print(f"✅ Found {len(wos)} work orders.")
    for wo in wos:
        print(f"   - {wo['title']} ({wo['status']})")
else:
    print(f"❌ Failed to fetch list: {r.status_code} - {r.text}")

# 3. Get Stats
print("3. Fetching Stats...")
r = requests.get(f"{BASE_URL}/work-orders/stats", headers=headers)
if r.status_code == 200:
    stats = r.json()
    print(f"✅ Stats fetched successfully: {stats}")
else:
    print(f"❌ Failed to fetch stats: {r.status_code} - {r.text}")
