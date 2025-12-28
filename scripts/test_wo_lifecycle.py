
import json
import urllib.request
import urllib.error
import time

# Configuration
API_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@acme.com"
PASSWORD = "ScrapHand"

def get_token(email, password):
    print(f"Logging in as {email}...")
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

def create_wo(token):
    print("Creating WO...")
    url = f"{API_URL}/work-orders/"
    payload = {
        "title": "Lifecycle Test WO",
        "description": "Testing create -> start -> complete",
        "status": "new",
        "priority": "medium"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            wo = json.loads(response.read().decode('utf-8'))
            print(f"WO Created: {wo['id']} ({wo['work_order_number']})")
            return wo['id']
    except urllib.error.HTTPError as e:
        print(f"Create Failed: {e.code} {e.read().decode('utf-8')}")
        return None

def update_wo_status(token, wo_id, status):
    print(f"Updating WO {wo_id} to {status}...")
    url = f"{API_URL}/work-orders/{wo_id}"
    payload = {"status": status}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), method="PUT")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            wo = json.loads(response.read().decode('utf-8'))
            print(f"Update Success. New Status: {wo['status']}")
            if status == 'completed':
                print(f"Completed By: {wo.get('completed_by_user_id')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"Update Failed: {e.code} {e.read().decode('utf-8')}")
        return False

def delete_wo(token, wo_id):
    print(f"Deleting WO {wo_id}...")
    url = f"{API_URL}/work-orders/{wo_id}"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Delete Success.")
            return True
    except urllib.error.HTTPError as e:
        print(f"Delete Failed: {e.code} {e.read().decode('utf-8')}")
        return False

def main():
    token = get_token(ADMIN_EMAIL, PASSWORD)
    if not token:
        return
        
    wo_id = create_wo(token)
    if wo_id:
        update_wo_status(token, wo_id, "in_progress")
        update_wo_status(token, wo_id, "completed")
        delete_wo(token, wo_id)

if __name__ == "__main__":
    main()
