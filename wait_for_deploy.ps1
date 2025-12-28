
$url = "https://workorderpro-backend.onrender.com/debug-seed"
Write-Output "Polling $url for deployment availability..."

for ($i = 0; $i -lt 12; $i++) {
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            Write-Output "Endpoint Ready!"
            Write-Output "Seeding Logs:"
            Write-Output $res.Content
            exit 0
        }
    }
    catch {
        Write-Output "Waiting for deployment... ($i)"
        Start-Sleep -Seconds 10
    }
}
Write-Output "Timeout waiting for deployment."
