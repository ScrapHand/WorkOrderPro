from fastapi import FastAPI
from app.main import app

print("=== Registered Routes ===")
for route in app.routes:
    if hasattr(route, "path"):
        print(f"{route.path} [{','.join(route.methods)}]")
    else:
        print(route)
print("=========================")
