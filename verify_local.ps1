
$baseUrl = "http://localhost:8000/api/v1"
$username = "admin@demo.com"
$password = "password"
$tenantSlug = "demo"

# 1. Login
Write-Output "1. Attempting Login..."
$body = @{ username = $username; password = $password }
try {
    $loginRes = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded" -UseBasicParsing
    $tokenObj = $loginRes.Content | ConvertFrom-Json
    $token = $tokenObj.access_token
    Write-Output "   Login SUCCESS! Token received."
}
catch {
    Write-Output "   Login FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $_.Exception.Response.GetResponseStream() | % { [System.IO.StreamReader]::new($_).ReadToEnd() }
    }
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "X-Tenant-Slug" = $tenantSlug
    "Content-Type"  = "application/json"
}

# 2. Get Tenant Info
Write-Output "2. Verifying Tenant Context..."
try {
    $tenantRes = Invoke-WebRequest -Uri "$baseUrl/tenants/me" -Method Get -Headers $headers -UseBasicParsing
    Write-Output "   Tenant Me: SUCCESS ($($tenantRes.Content))"
}
catch {
    Write-Output "   Tenant Me FAILED: $($_.Exception.Message)"
}

# 3. Create Asset
Write-Output "3. Creating Test Asset..."
$assetBody = @{
    name     = "API Test Asset $(Get-Date -Format 'HHmm')"
    code     = "TEST-$(Get-Date -Format 'HHmm')"
    category = "Test"
    status   = "active"
} | ConvertTo-Json
try {
    $assetRes = Invoke-WebRequest -Uri "$baseUrl/assets/" -Method Post -Headers $headers -Body $assetBody -UseBasicParsing
    $asset = $assetRes.Content | ConvertFrom-Json
    Write-Output "   Asset Creation SUCCESS! ID: $($asset.id)"
}
catch {
    Write-Output "   Asset Creation FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $body = $reader.ReadToEnd()
        Write-Output "   Error Body: $body"
    }
}

# 4. Create Work Order
Write-Output "4. Creating Test Work Order..."
if ($asset.id) {
    $woBody = @{
        title       = "API Test Work Order"
        description = "Created via PowerShell verification script"
        priority    = "medium"
        status      = "new"
        asset_id    = $asset.id
    } | ConvertTo-Json
    
    try {
        $woRes = Invoke-WebRequest -Uri "$baseUrl/work-orders/" -Method Post -Headers $headers -Body $woBody -UseBasicParsing
        $wo = $woRes.Content | ConvertFrom-Json
        Write-Output "   Work Order Creation SUCCESS! ID: $($wo.id)"
    }
    catch {
        Write-Output "   Work Order Creation FAILED: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $body = $reader.ReadToEnd()
            Write-Output "   Error Body: $body"
        }
    }
}
else {
    Write-Output "   Skipping Work Order creation (Asset creation failed)"
}
