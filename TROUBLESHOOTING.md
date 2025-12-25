# Logo Upload Troubleshooting Guide

## Current Status
The logo upload feature requires both backend and frontend to be running with correct CORS configuration.

## Step-by-Step Fix

### 1. Stop Everything
- Stop the backend (Ctrl+C)
- Stop the frontend (Ctrl+C)

### 2. Verify Backend Setup
```powershell
cd backend
.\venv\Scripts\python.exe -m app.main
```

**Expected output:**
- Server running on `http://localhost:8000`
- "Seeded 'demo' tenant" (first time only)

**Test the backend:**
Open another terminal:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/tenants/me" -Headers @{"X-Tenant-Slug"="demo"}
```

Should return tenant data (not 404).

### 3. Start Frontend
```powershell
cd frontend
npm run dev
```

### 4. Test Upload Flow
1. Go to `http://localhost:3000/demo/admin`
2. Click "Branding" tab
3. Upload a PNG file
4. **Watch for alerts** - they will tell you exactly what failed

## Common Issues

### Issue 1: "Upload failed: Field required"
- The file upload endpoint is working but no file was attached
- Try a different file or browser

### Issue 2: "Upload failed: 404"
- Backend is not running or wrong URL
- Verify backend is on port 8000

### Issue 3: Upload succeeds but save fails
- CORS issue (backend needs specific origin, not `*`)
- Check backend console for CORS errors

### Issue 4: Logo doesn't appear in sidebar
- Backend didn't save to database
- Frontend context not refreshing
- Check backend database: `workorderpro.db` should exist with `tenant_themes` table

## Debug Commands

### Check if backend is running:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/"
```

### Check if routes are registered:
```powershell
cd backend
.\venv\Scripts\python.exe debug_routes.py 2>$null | Select-String "upload"
```

Should show: `{'POST'} /api/v1/utils/upload`

### Check database state:
```powershell
cd backend
.\venv\Scripts\python.exe -c "import sqlite3; conn = sqlite3.connect('workorderpro.db'); print(conn.execute('SELECT * FROM tenant_themes').fetchall())"
```

This shows saved themes. Should see a row after successful save.
