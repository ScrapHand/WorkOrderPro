
import requests

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@demo.com"
PASSWORD = "password123"

def test_crud():
    session = requests.Session()
    session.headers.update({"X-Tenant-Slug": "demo"})

    # 1. Login
    print("Logging in...")
    resp = session.post(f"{BASE_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ Login successful")

    # 2. Create User
    print("Creating user...")
    new_user = {
        "email": "testapi@example.com",
        "password": "password123",
        "full_name": "API Test User",
        "role": "viewer"
    }
    resp = session.post(f"{BASE_URL}/users/", json=new_user)
    if resp.status_code != 200:
        print(f"Create user failed: {resp.text}")
        return
    user_id = resp.json()["id"]
    print(f"✅ User created: {user_id}")

    # 3. Update User
    print("Updating user...")
    update_data = {
        "full_name": "API Test User Updated",
        "role": "tech"
    }
    resp = session.put(f"{BASE_URL}/users/{user_id}", json=update_data)
    if resp.status_code != 200:
        print(f"Update user failed: {resp.text}")
        return
    updated = resp.json()
    if updated["full_name"] != "API Test User Updated" or updated["role"] != "tech":
        print("Update mismatch")
        return
    print("✅ User updated")

    # 4. Delete User
    print("Deleting user...")
    resp = session.delete(f"{BASE_URL}/users/{user_id}")
    if resp.status_code != 200:
        print(f"Delete user failed: {resp.text}")
        return
    print("✅ User deleted")

    # 5. Verify Deletion
    resp = session.get(f"{BASE_URL}/users/")
    users = resp.json()
    found = any(u["id"] == user_id for u in users)
    if found:
        print("❌ User still found in list!")
    else:
        print("✅ User successfully removed from list")

if __name__ == "__main__":
    test_crud()
