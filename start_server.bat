@echo off
cd /d "D:\App dev\Copy App for Mprofit\backend"
echo Starting Mprofit Portfolio Server... >> "%TEMP%\mprofit_startup.log"
echo %DATE% %TIME% >> "%TEMP%\mprofit_startup.log"
"D:\App dev\Copy App for Mprofit\backend\venv\Scripts\uvicorn.exe" main:app --host 0.0.0.0 --port 8001 >> "%TEMP%\mprofit_startup.log" 2>&1
