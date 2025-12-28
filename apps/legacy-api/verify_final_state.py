import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
HEADERS = {"X-Tenant-Slug": "demo"}

def verify():
    # Login Admin
    print("Logging in...")
    r = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@demo.com", "password": "password"}, headers=HEADERS)
    if r.status_code != 200:
        print("Login Failed")
        return
    token = r.json()["access_token"]
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    # Fetch WOs
    search_term = "GoldenJob"
    print(f"Searching for '{search_term}'...")
    r = requests.get(f"{BASE_URL}/work-orders/?search={search_term}", headers=headers)
    if r.status_code == 200:
        wos = r.json()
        found = False
        for wo in wos:
            if wo["title"] == search_term:
                found = True
                print(f"FOUND: ID={wo['id']}, Status={wo['status']}, SignedBy={wo['signed_by_name']}")
                if wo['status'] == 'completed' and wo['signed_by_name'] == 'Eng Golden II':
                    print("SUCCESS: Work Order is Completed and Signed!")
                else:
                    print("FAILURE: Status/Signature mismatch.")
        if not found:
            print("FAILURE: Work Order not found.")
            
    print("Searching for Asset 'GoldenAsset'...")
    r = requests.get(f"{BASE_URL}/assets/", headers=headers)
    if r.status_code == 200:
        assets = r.json()
        found_asset = False
        for a in assets:
            if a["name"] == "GoldenAsset":
                print(f"FOUND ASSET: {a['name']} ({a['id']})")
                found_asset = True
        if not found_asset:
            print("FAILURE: Asset not found.")
    else:
        print(f"API Error: {r.status_code}")

if __name__ == "__main__":
    verify()
