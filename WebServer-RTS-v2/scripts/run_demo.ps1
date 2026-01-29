param(
  [string]$Config = "configs\baseline.yaml",
  [int]$DurationS = 20
)

$results = "results\demo"
New-Item -ItemType Directory -Force -Path $results | Out-Null

python -m src.apps.benchmark_run --config $Config --results-dir $results --duration-s $DurationS
