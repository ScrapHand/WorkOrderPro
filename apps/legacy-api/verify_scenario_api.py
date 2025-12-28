import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

def get_token(email, password):
    r = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password}, headers=HEADERS)
    if r.status_code != 200:
        print(f"Login failed for {email}: {r.text}")
        return None
    return r.json()["access_token"]

def verify_scenario():
    print("--- 1. Manager Phase ---")
    mgr_token = get_token("manager@test.com", "password")
    if not mgr_token: return
    mgr_headers = {**HEADERS, "Authorization": f"Bearer {mgr_token}"}

    # Assets
    assets = [("Asset Alpha", "A001"), ("Asset Beta", "B002"), ("Asset Gamma", "C003")]
    asset_ids = {}
    print("Creating Assets...")
    for name, code in assets:
        r = requests.post(f"{BASE_URL}/assets/", json={"name": name, "code": code}, headers=mgr_headers)
        if r.status_code == 200:
            data = r.json()
            asset_ids[code] = data["id"]
            print(f"  Created {name}")
        else:
            print(f"  Failed {name}: {r.text}")

    # Inventory
    inventory = [("Filter X", 10), ("Belt Y", 5), ("Oil Z", 20)]
    print("\nCreating Inventory...")
    for name, stock in inventory:
        r = requests.post(f"{BASE_URL}/inventory/", json={"item_id": name.replace(" ", ""), "name": name, "stock": stock, "uom": "EA", "category": "Parts"}, headers=mgr_headers)
        if r.status_code == 200:
            print(f"  Created {name}")

    # PM Schedules
    print("\nCreating PM Schedules...")
    if "A001" in asset_ids:
        r = requests.post(f"{BASE_URL}/pm-schedules/", json={"title": "Monthly Check", "description": "Check Alpha", "frequency_days": 30, "asset_id": asset_ids["A001"]}, headers=mgr_headers)
        print(f"  Created Monthly Check: {r.status_code}")
    if "B002" in asset_ids:
        r = requests.post(f"{BASE_URL}/pm-schedules/", json={"title": "Weekly Grease", "description": "Grease Beta", "frequency_days": 7, "asset_id": asset_ids["B002"]}, headers=mgr_headers)
        print(f"  Created Weekly Grease: {r.status_code}")

    # Work Orders
    work_orders = []
    print("\nCreating Work Orders...")
    wo_defs = [
        ("Fix Alpha", "Fix the alpha machine", "high", "A001"),
        ("Inspect Beta", "Routine inspection", "medium", "B002"),
        ("Service Gamma", "Full Service", "low", "C003")
    ]
    for title, desc, prio, code in wo_defs:
        payload = {"title": title, "description": desc, "priority": prio}
        if code in asset_ids:
            payload["asset_id"] = asset_ids[code]
        
        r = requests.post(f"{BASE_URL}/work-orders/", json=payload, headers=mgr_headers)
        if r.status_code == 200:
            data = r.json()
            work_orders.append(data["id"])
            print(f"  Created WO: {title}")
        else:
            print(f"  Failed WO {title}: {r.text}")

    print("\n--- 2. Engineer Phase ---")
    eng_token = get_token("engineer@test.com", "password")
    if not eng_token: return
    eng_headers = {**HEADERS, "Authorization": f"Bearer {eng_token}"}

    print("Processing Work Orders...")
    for wo_id in work_orders:
        # Start
        r = requests.put(f"{BASE_URL}/work-orders/{wo_id}", json={"status": "in_progress"}, headers=eng_headers)
        if r.status_code == 200:
            print(f"  Started WO {wo_id}")
        else:
             print(f"  Failed Start {wo_id}: {r.text}")

        # Complete
        r = requests.put(f"{BASE_URL}/work-orders/{wo_id}", json={"status": "completed", "completion_notes": "Done by Eng", "signed_by_name": "Eng One"}, headers=eng_headers)
        if r.status_code == 200:
            print(f"  Completed WO {wo_id}")
        else:
            print(f"  Failed Complete {wo_id}: {r.text}")

    print("\n--- TEST COMPLETE ---")

if __name__ == "__main__":
    verify_scenario()
