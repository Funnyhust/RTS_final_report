@echo off
title RTS System Launcher (Integrated)

echo ===============================================
echo [RTS-LAB] ONE-CLICK SYSTEM START
echo ===============================================

REM ---------------------------------------------
REM 1. Start Broker
REM ---------------------------------------------
echo 1. Starting Mosquitto Broker (Window 1)...
start "RTS - Local Broker" cmd /k "echo Starting Broker... && mosquitto -c mosquitto_local.conf -v"

echo 2. Waiting 2 seconds...
timeout /t 2 /nobreak >nul

REM ---------------------------------------------
REM 2. Start Server
REM ---------------------------------------------
echo 3. Starting Python Server (Window 2)...
start "RTS - Server" cmd /k "echo Starting Collector... && cd WebServer-RTS-v2 && python -m src.apps.collector_main --config configs\baseline.yaml --results-dir results\live_server"

REM ---------------------------------------------
REM 3. Information
REM ---------------------------------------------
echo.
echo [OK] All systems started in background windows.
echo - Broker:  localhost:1883
echo - Server:  Connecting to Firebase...
echo.
echo [TIP] To control system, open another terminal and run:
echo        python WebServer-RTS-v2/scripts/mqtt_control.py --help
echo.
pause
