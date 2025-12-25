
$res = Invoke-WebRequest -Uri "https://workorderpro-backend.onrender.com/debug-seed" -Method Get -UseBasicParsing
Write-Output "Status: $($res.StatusCode)"
Write-Output "Content:"
Write-Output $res.Content
