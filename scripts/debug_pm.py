
import json
import urllib.request
import urllib.error

# Configuration
API_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@acme.com"
PASSWORD = "ScrapHand"

def login():
    print(f"Logging in as {EMAIL}...")
    url = f"{API_URL}/auth/login"
    # x-www-form-urlencoded
    data = f"username={EMAIL}&password={PASSWORD}".encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Login failed: {response.status}")
                return None
            body = response.read().decode('utf-8')
            return json.loads(body)["access_token"]
    except urllib.error.HTTPError as e:
        print(f"Login Error: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
        return None

def create_asset(token):
    print("\nAttempting to create Asset...")
    url = f"{API_URL}/assets/"
    payload = {
        "name": "Debug Asset",
        "code": "DBG-001",
        "status": "Healthy"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Tenant-Slug", "acme")
    
    with urllib.request.urlopen(req) as response:
        body = json.loads(response.read().decode('utf-8'))
        print(f"Asset Created: {body['id']}")
        return body['id']

def create_pm(token):
    asset_id = create_asset(token)
    print("\nAttempting to create PM Schedule...")
    url = f"{API_URL}/pm-schedules/"
    
    # Payload matching frontend exactly
    payload = {
        "title": "Test PM Sequence Linked",
        "description": "Debug script creation",
        "frequency_type": "daily",
        "frequency_interval": 1,
        "asset_id": asset_id, 
        "next_due": "2024-01-01T10:00:00.000Z",
        "is_active": True
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Tenant-Slug", "acme")
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Request failed: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))

if __name__ == "__main__":
    token = login()
    if token:
        create_pm(token)
