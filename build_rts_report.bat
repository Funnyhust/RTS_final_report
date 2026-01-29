@echo off
chcp 65001 >nul
echo =========================================
echo   BUILD RTS_Report.tex to PDF
echo =========================================
echo.

REM Set paths
set "MIKTEX_PATH=C:\Users\gmoba\AppData\Local\Programs\MiKTeX\miktex\bin\x64"
set "REPORT_DIR=C:\Users\gmoba\RTS_final_report\Report"
set "TEX_FILE=RTS_Report.tex"

REM Add MiKTeX to PATH
set "PATH=%MIKTEX_PATH%;%PATH%"

REM Change to Report directory
cd /d "%REPORT_DIR%"
echo [DIR] %REPORT_DIR%
echo [FILE] %TEX_FILE%
echo.

REM Build pass 1
echo [1/2] Building (first pass)...
xelatex -interaction=nonstopmode "%TEX_FILE%" >nul 2>&1

REM Build pass 2 (for TOC)
echo [2/2] Building (second pass)...
xelatex -interaction=nonstopmode "%TEX_FILE%" >nul 2>&1

REM Check result
if exist "RTS_Report.pdf" (
    echo.
    echo =========================================
    echo   BUILD SUCCESSFUL!
    echo =========================================
    echo.
    echo PDF: %REPORT_DIR%\RTS_Report.pdf
    echo.
    
    REM Ask to open
    set /p OPEN_PDF="Open PDF? (y/n): "
    if /i "%OPEN_PDF%"=="y" start "" "RTS_Report.pdf"
) else (
    echo.
    echo [FAILED] Build failed! Check RTS_Report.log
)

pause
