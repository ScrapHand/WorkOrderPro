import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

print("=== Testing Asset Creation ===")
print()

# 1. Login as manager
print("1. Logging in as manager@test.com...")
r = requests.post(f"{BASE_URL}/auth/login", 
                 data={"username": "manager@test.com", "password": "password"}, 
                 headers=HEADERS)
if r.status_code != 200:
    print(f"   ❌ Login Failed: {r.status_code} - {r.text}")
    exit(1)
print(f"   ✅ Login successful")

token = r.json()["access_token"]
auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

# 2. Create an asset
print()
print("2. Creating asset 'Direct Test Asset'...")
asset_data = {
    "name": "Direct Test Asset",
    "code": "DTA001",
    "location": "Test Lab",
    "category": "Testing"
}

r = requests.post(f"{BASE_URL}/assets/", json=asset_data, headers=auth_headers)
print(f"   Status Code: {r.status_code}")
if r.status_code == 200:
    print(f"   ✅ Asset created successfully!")
    print(f"   Response: {r.json()}")
else:
    print(f"   ❌ Failed to create asset")
    print(f"   Error: {r.text}")

# 3. List assets to verify
print()
print("3. Listing all assets...")
r = requests.get(f"{BASE_URL}/assets/", headers=auth_headers)
if r.status_code == 200:
    assets = r.json()
    print(f"   Found {len(assets)} assets:")
    for asset in assets:
        print(f"     - {asset['name']} ({asset['code']})")
else:
    print(f"   ❌ Failed to list assets: {r.text}")
