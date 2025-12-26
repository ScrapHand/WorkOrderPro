import requests
import json

def check_prod():
    base_url = "https://workorderpro-backend.onrender.com/api/v1"
    
    auth_data = [
        {"slug": "demo", "email": "admin@demo.com", "password": "password"},
        {"slug": "acme", "email": "admin@acme.com", "password": "password"}
    ]
    
    for auth in auth_data:
        slug = auth["slug"]
        print(f"\n=== Checking Tenant: {slug} ===")
        try:
            r = requests.post(f"{base_url}/auth/login", 
                               data={"username": auth["email"], "password": auth["password"]}, 
                               headers={"X-Tenant-Slug": slug})
            if r.status_code == 200:
                print(f"Login SUCCESS for {slug}")
                token = r.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}", "X-Tenant-Slug": slug}
                
                # Check Work Orders
                r_wo = requests.get(f"{base_url}/work-orders/", headers=headers)
                print(f"Work Orders: {len(r_wo.json())}")
                
                # Check Assets
                r_assets = requests.get(f"{base_url}/assets/", headers=headers)
                print(f"Assets: {len(r_assets.json())}")
                
                # Check Inventory
                r_inv = requests.get(f"{base_url}/inventory/", headers=headers)
                print(f"Inventory: {len(r_inv.json())}")
            else:
                print(f"Login FAILED for {slug}: {r.status_code}")
                print(r.text)
        except Exception as e:
            print(f"Request failed for {slug}: {e}")

if __name__ == "__main__":
    check_prod()
