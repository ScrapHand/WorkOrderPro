
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

def check_me(token):
    print("\nFetching /users/me ...")
    url = f"{API_URL}/users/me"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            user = json.loads(body)
            print(f"User: {user.get('email')}")
            print(f"Role: {user.get('role')} (Type: {type(user.get('role'))})")
            return user
    except urllib.error.HTTPError as e:
        print(f"Me Error: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))

def check_work_orders(token):
    print("\nFetching /work-orders/ ...")
    url = f"{API_URL}/work-orders/"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-Tenant-Slug", "acme")
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            wos = json.loads(body)
            print(f"Work Orders Found: {len(wos)}")
            for wo in wos:
                print(f"- {wo.get('title')} ({wo.get('status')})")
    except urllib.error.HTTPError as e:
        print(f"WO Error: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))

if __name__ == "__main__":
    token = login()
    if token:
        check_me(token)
        check_work_orders(token)
