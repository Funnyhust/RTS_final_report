# Real-Time System - Fire Alarm in Apartment

This project implements Part 3 (Real-time Communication via MQTT) and Part 4 (Real-time Data/Database via Firebase Realtime Database) with end-to-end timing, jitter, and RT-DBMS freshness metrics.

## Requirements
- Windows 10/11
- Python 3.10+
- No Docker
- MQTT broker (local Mosquitto recommended)

## Quick Start (Windows)
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### MQTT Broker
Install Mosquitto locally (recommended) or use a public broker in `configs/*.yaml`.

### Firebase Setup (Optional)
See `docs/firebase_setup.md`. If no credentials are provided, the system runs in mock mode and still produces traces and KPIs.

## Run Demo
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run_demo.ps1 -Config configs\baseline.yaml
```

## Run Benchmark (baseline vs improved)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run_benchmark.ps1
```

## Run Stress Case
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run_stress.ps1
```

## Project Structure
```
configs/
src/
  common/
  comm/
  processing/
  rtdb/
  dashboard/
  apps/
scripts/
results/
docs/
```

## Notes
- End-to-end trace points are described in `docs/timestamp_points.md`.
- Experiment plan and rationale are in `docs/experiment_plan.md`.
- Firebase RTDB config guidance is in `docs/firebase_setup.md`.
