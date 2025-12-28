
# Check the debug endpoint
$response = Invoke-WebRequest -Uri "https://workorderpro-backend.onrender.com/debug-db" -Method Get
Write-Output $response.Content
