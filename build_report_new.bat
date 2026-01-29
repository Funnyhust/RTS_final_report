@echo off
chcp 65001 >nul
echo =========================================
echo   BUILD RTS REPORT (RELOCALIZED)
echo =========================================

REM Path to Tex File
set "REPORT_DIR=report\rts_report"
set "TEX_FILE=main.tex"

cd %REPORT_DIR%

echo [DIR] %CD%
echo [FILE] %TEX_FILE%

echo.
echo [1/2] Building (first pass)...
xelatex -interaction=nonstopmode %TEX_FILE%

echo.
echo [2/2] Building (second pass)...
xelatex -interaction=nonstopmode %TEX_FILE%

if exist "main.pdf" (
    echo.
    echo =========================================
    echo   BUILD SUCCESSFUL!
    echo =========================================
    echo PDF: %CD%\main.pdf
    start "" "main.pdf"
) else (
    echo.
    echo [FAILED] Build failed! See log above.
)
pause
