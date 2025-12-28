
import json
import urllib.request
import urllib.error
import time

# Configuration
API_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@acme.com"
PASSWORD = "ScrapHand"

def login():
    print(f"Logging in as {EMAIL}...")
    url = f"{API_URL}/auth/login"
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

def create_work_order(token):
    print("\nAttempting to create Work Order...")
    url = f"{API_URL}/work-orders/"
    payload = {
        "title": "Debug Delete Work Order",
        "description": "To be deleted",
        "status": "new",
        "priority": "low"
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            body = json.loads(response.read().decode('utf-8'))
            print(f"Work Order Created: {body['id']}")
            return body['id']
    except urllib.error.HTTPError as e:
        print(f"Create failed: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
        return None

def delete_work_order(token, wo_id):
    print(f"\nAttempting to DELETE Work Order {wo_id}...")
    url = f"{API_URL}/work-orders/{wo_id}"
    
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Delete failed: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))

if __name__ == "__main__":
    token = login()
    if token:
        wo_id = create_work_order(token)
        if wo_id:
            time.sleep(1)
            delete_work_order(token, wo_id)
