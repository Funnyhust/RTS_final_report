$baseline = "results\baseline"
$improved = "results\improved"
New-Item -ItemType Directory -Force -Path $baseline | Out-Null
New-Item -ItemType Directory -Force -Path $improved | Out-Null

python -m src.apps.benchmark_run --config configs\baseline.yaml --results-dir $baseline
python -m src.apps.benchmark_run --config configs\improved.yaml --results-dir $improved

Write-Host "Baseline summary:" -ForegroundColor Cyan
Get-Content (Join-Path $baseline "summary.json")
Write-Host "Improved summary:" -ForegroundColor Cyan
Get-Content (Join-Path $improved "summary.json")
