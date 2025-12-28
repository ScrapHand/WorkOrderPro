
$url = "https://workorderpro-backend.onrender.com/debug-seed"
Write-Output "Polling $url for successful seeding (no ERRORs)..."

for ($i = 0; $i -lt 24; $i++) {
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
        $content = $res.Content
        if ($content -match "ERROR") {
            Write-Output "Attempt $($i): Seeding failed with ERROR. Deployment might be stale."
        }
        else {
            Write-Output "Attempt $($i): Seeding SUCCESS!"
            Write-Output "Logs:"
            Write-Output $content
            exit 0
        }
    }
    catch {
        Write-Output "Attempt $($i): Request failed ($($_.Exception.Message))"
    }
    Start-Sleep -Seconds 10
}
Write-Output "Timeout waiting for successful seeding."
exit 1
