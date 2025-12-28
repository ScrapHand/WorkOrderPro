
$baseUrl = "https://workorderpro-backend.onrender.com/api/v1"
$username = "admin@demo.com"
$password = "password"
$tenantSlug = "demo"

# Login
$body = @{ username = $username; password = $password }
try {
    $loginRes = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded" -UseBasicParsing
    $token = ($loginRes.Content | ConvertFrom-Json).access_token
}
catch {
    Write-Output "Login Failed"
    exit 1
}

$headers = @{ "Authorization" = "Bearer $token"; "X-Tenant-Slug" = $tenantSlug }

# Get Stats
try {
    $statsRes = Invoke-WebRequest -Uri "$baseUrl/work-orders/stats" -Method Get -Headers $headers -UseBasicParsing
    Write-Output "Stats Response:"
    Write-Output $statsRes.Content
}
catch {
    Write-Output "Stats Check Failed: $($_.Exception.Message)"
}

# Get List
try {
    $listRes = Invoke-WebRequest -Uri "$baseUrl/work-orders/" -Method Get -Headers $headers -UseBasicParsing
    Write-Output "Work Order List (Count: $(($listRes.Content | ConvertFrom-Json).Count))"
}
catch {
    Write-Output "List Check Failed"
}
