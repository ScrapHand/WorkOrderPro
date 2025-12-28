# ⚠️ BACKEND IS FROZEN

The backend server has stopped responding (Deadlock), which is why you see "No tenant data".

## Fix: Force Kill and Restart

1. **Find the backend terminal** and press `Ctrl+C` multiple times. if it doesn't close, close the window.

2. **Kill any zombie processes** (Run this in a fresh terminal):
   ```powershell
   taskkill /F /IM python.exe /T
   taskkill /F /IM uvicorn.exe /T
   ```
   *(Note: This closes all Python scripts. If you have other Python apps running, avoid this and just close the backend terminal manually)*

3. **Start Backend Again**:
   ```powershell
   cd backend
   .\venv\Scripts\uvicorn.exe app.main:app --reload
   ```

4. **Verify it's working**:
   ```powershell
   invoke-webrequest http://localhost:8000/
   ```
   Should return 200 OK immediately.

5. **Then Refresh Frontend**.
