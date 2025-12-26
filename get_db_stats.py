import requests
import json

def list_users():
    # Use the migrate-db endpoint to get stats
    url = "https://workorderpro-backend.onrender.com/api/v1/utils/migrate-db"
    try:
        r = requests.post(url)
        print("Stats:", r.json())
    except Exception as e:
        print(f"Failed to get stats: {e}")

if __name__ == "__main__":
    list_users()
