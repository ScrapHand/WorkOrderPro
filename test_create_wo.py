import requests
import json

def test_create_wo():
    base_url = "https://workorderpro-backend.onrender.com/api/v1"
    
    # 1. Login
    payload = {"username": "admin@demo.com", "password": "password"}
    r = requests.post(f"{base_url}/auth/login", data=payload, headers={"X-Tenant-Slug": "demo"})
    if r.status_code != 200:
        print(f"Login failed: {r.status_code}")
        print(r.text)
        return
    
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "X-Tenant-Slug": "demo"}
    
    # 2. Get Assets (needed for WO creation)
    r_assets = requests.get(f"{base_url}/assets/", headers=headers)
    assets = r_assets.json()
    if not assets:
        print("No assets found. Creating an asset first...")
        r_asset_create = requests.post(f"{base_url}/assets/", 
                                      headers=headers, 
                                      json={"name": "Test Asset", "code": "TEST-01", "status": "active"})
        if r_asset_create.status_code != 200:
            print(f"Asset creation failed: {r_asset_create.status_code}")
            print(r_asset_create.text)
            return
        asset_id = r_asset_create.json()["id"]
    else:
        asset_id = assets[0]["id"]
    
    # 3. Create Work Order
    wo_data = {
        "title": "Debug Work Order",
        "description": "Checking for creation issues",
        "priority": "low",
        "status": "new",
        "asset_id": asset_id
    }
    
    r_wo_create = requests.post(f"{base_url}/work-orders/", headers=headers, json=wo_data)
    print(f"Work Order Creation Status: {r_wo_create.status_code}")
    print(f"Response: {r_wo_create.text}")

if __name__ == "__main__":
    test_create_wo()
