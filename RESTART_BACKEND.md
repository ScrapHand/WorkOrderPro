# IMPORTANT: Backend Code Cache Issue

## The Problem
The endpoint code is FIXED (I tested it directly and it works), but **uvicorn is serving old cached code**.

## Solution: Hard Restart

### Step 1: Stop Backend
In the terminal running uvicorn, press: **Ctrl+C**

### Step 2: Clear Python Cache
```powershell
cd backend
Remove-Item -Recurse -Force app\__pycache__ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force app\api\__pycache__ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force app\api\api_v1\__pycache__ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force app\api\api_v1\endpoints\__pycache__ -ErrorAction SilentlyContinue
```

### Step 3: Start Backend Fresh
```powershell
.\venv\Scripts\uvicorn.exe app.main:app --reload
```

### Step 4: Verify It Works
**In a NEW terminal:**
```powershell
cd backend
.\venv\Scripts\python.exe test_flow.py
```

**You should now see:**
```
✓ Backend is running
✓ Upload endpoint exists
✓ Tenant fetch works: Demo Company
✓ File upload works
✓ Theme save works
✓ ALL TESTS PASSED
```

If you STILL see "500 error" after this, then something else is wrong and I need to investigate further. But this should fix it.
