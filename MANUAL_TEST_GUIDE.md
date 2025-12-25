# Manual Test Guide - Please Follow These Steps

## Test 1: Create an Asset

1. Open your browser to: http://localhost:3000/demo/dashboard
2. **Login as Manager**:
   - Email: `manager@test.com`
   - Password: `password`
3. Click on "Assets" in the sidebar
4. Click the "+ Add New Asset" button
5. Fill in the form:
   - Name: `Test Asset Manual`
   - Code: `TM001`
6. Click "Save"
7. **Tell me what happens**:
   - Does the modal close?
   - Does the asset appear in the list?
   - Do you see any errors?

## Test 2: Create a Work Order

1. Go to "Work Orders" in the sidebar
2. Click "+ Create Work Order"
3. Fill in:
   - Title: `Test Job Manual`
   - Description: `Testing manually with real user`
   - Priority: High
   - Asset: Select "Test Asset Manual (TM001)" if it appears
4. Click "Create Work Order"
5. **Tell me what happens**:
   - Are you redirected to the work orders list?
   - Do you see "Test Job Manual" in the list?
   - Any errors in the browser console (Press F12)?

## If Something Fails

**Open Browser Console (F12) and:**
1. Go to the "Console" tab
2. Look for red error messages
3. Copy and paste any errors you see
4. Tell me at which step it failed

I'll be monitoring the backend logs on my end while you do this.
