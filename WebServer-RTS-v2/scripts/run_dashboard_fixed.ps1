$npmPath = "C:\Program Files\nodejs\npm.cmd"
$nodeDir = "C:\Program Files\nodejs"

# Determine script location explicitly to resolve relative paths correctly
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path $scriptPath
$projectDir = Join-Path $scriptDir "..\web-dashboard"

# Thêm Node.js vào PATH tạm thời cho session này để các tiến trình con (như vite/node) tìm thấy nó
$env:Path = "$nodeDir;$env:Path"

Write-Host "Starting Web Dashboard with corrected PATH..." -ForegroundColor Cyan
Set-Location $projectDir

& $npmPath run dev
