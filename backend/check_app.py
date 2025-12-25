
import sys
try:
    from app.main import app
    print("✅ App imported successfully.")
except Exception as e:
    import traceback
    print("❌ App import failed:")
    traceback.print_exc()
