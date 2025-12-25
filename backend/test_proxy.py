import requests

print("=== Testing Next.js Proxy Connectivity ===")
URL = "http://localhost:3000/api/v1/auth/login"

try:
    print(f"POSTing to {URL}...")
    r = requests.post(URL, json={"username": "manager@test.com", "password": "password"})
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("✅ Proxy is WORKING. Backend reached.")
    elif r.status_code == 404:
        print("❌ Proxy is BROKEN (404 Not Found). Next.js is not routing this.")
    else:
        print(f"⚠️ Proxy returned unexpected status: {r.status_code}")
        print(r.text[:200])
except Exception as e:
    print(f"❌ Connection Failed: {e}")
