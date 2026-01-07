$results = "results\stress"
New-Item -ItemType Directory -Force -Path $results | Out-Null

python -m src.apps.benchmark_run --config configs\stress.yaml --results-dir $results

Write-Host "Stress summary:" -ForegroundColor Cyan
Get-Content (Join-Path $results "summary.json")
