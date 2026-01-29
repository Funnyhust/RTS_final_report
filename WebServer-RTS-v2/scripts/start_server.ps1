$config = "configs\baseline.yaml"
$results = "results\live_server"

# Chuyển về thư mục gốc của project (WebServer-RTS-v2) bất kể đang đứng ở đâu
$scriptPath = $MyInvocation.MyCommand.Path
$projectRoot = Split-Path (Split-Path $scriptPath -Parent) -Parent
Set-Location $projectRoot

New-Item -ItemType Directory -Force -Path $results | Out-Null

Write-Host "Starting RTS Server (Collector Only)..." -ForegroundColor Green
Write-Host "Listening on MQTT 0.0.0.0:1883" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

# Kiểm tra xem có Virtual Env không, nếu có thì dùng Python trong đó
if (Test-Path ".venv\Scripts\python.exe") {
    $pythonCmd = ".venv\Scripts\python.exe"
    Write-Host "Using Virtual Environment Python: $pythonCmd" -ForegroundColor Gray
} else {
    $pythonCmd = "C:\Users\gmoba\AppData\Local\Programs\Python\Python311\python.exe"
    Write-Host "Using System Python" -ForegroundColor Gray
}

# Chạy collector_main trực tiếp
& $pythonCmd -m src.apps.collector_main --config $config --results-dir $results
