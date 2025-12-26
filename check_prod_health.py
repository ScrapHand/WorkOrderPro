import requests
import json

def check_prod():
    base_url = "https://workorderpro-backend.onrender.com/api/v1"
    tenants = ["demo", "acme"]
    
    print(f"Checking Backend: {base_url}")
    
    # 1. Root check
    try:
        r = requests.get("https://workorderpro-backend.onrender.com/")
        print(f"Root URL Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Root URL Failed: {e}")

    # 2. Tenant verification
    for slug in tenants:
        print(f"\nChecking Tenant: {slug}")
        # We can't list assets without login, but we can check if the tenant exists 
        # by seeing if we get 401 (exists) vs 404 (doesn't exist)
        try:
            r = requests.get(f"{base_url}/assets/", headers={"X-Tenant-Slug": slug})
            if r.status_code == 401:
                print(f"Tenant '{slug}': EXISTS (401 Unauthorized as expected)")
            elif r.status_code == 404:
                print(f"Tenant '{slug}': NOT FOUND (404)")
            else:
                print(f"Tenant '{slug}': UNEXPECTED STATUS {r.status_code}")
                print(r.text)
        except Exception as e:
            print(f"Request failed for {slug}: {e}")

    # 3. Login Check for demo
    print("\nAttempting Login (demo)...")
    try:
        payload = {"username": "admin@demo.com", "password": "password"}
        r = requests.post(f"{base_url}/auth/login", data=payload, headers={"X-Tenant-Slug": "demo"})
        if r.status_code == 200:
            print("Login SUCCESS (demo)")
            token = r.json()["access_token"]
            # Check Work Orders
            r_wo = requests.get(f"{base_url}/work-orders/", headers={"Authorization": f"Bearer {token}", "X-Tenant-Slug": "demo"})
            print(f"Work Orders Count: {len(r_wo.json())}")
        else:
            print(f"Login FAILED (demo): {r.status_code}")
            print(r.text)
    except Exception as e:
        print(f"Login attempt failed: {e}")

if __name__ == "__main__":
    check_prod()
