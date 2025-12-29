
import json
import urllib.request
import urllib.error
import sys

# Configuration
API_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@acme.com"
PASSWORD = "ScrapHand"

def get_token(email, password):
    url = f"{API_URL}/auth/login"
    data = f"username={email}&password={password}".encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            return json.loads(body)["access_token"]
    except urllib.error.HTTPError as e:
        print(f"Login Failed: {e.code} {e.read().decode('utf-8')}")
        return None

def debug_archives(token):
    print("\n--- Debugging Archives (status=completed) ---")
    url = f"{API_URL}/work-orders/?status=completed&limit=10000"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            data = json.loads(body)
            print(f"Success. Count: {len(data)}")
            if len(data) > 0:
                print("Sample Item:")
                print(json.dumps(data[0], indent=2))
            else:
                print("No completed orders found.")
    except urllib.error.HTTPError as e:
        print(f"Failed: {e.code}")
        print(e.read().decode('utf-8'))

def main():
    token = get_token(ADMIN_EMAIL, PASSWORD)
    if not token:
        return
    debug_archives(token)

if __name__ == "__main__":
    main()
