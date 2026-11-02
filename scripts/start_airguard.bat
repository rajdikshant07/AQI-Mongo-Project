@echo off
TITLE AirGuard - Environmental Intelligence Platform Launcher
COLOR 0A

echo ===============================================================================
echo                AIRGUARD ENVIRONMENTAL INTELLIGENCE PLATFORM
echo     Intelligent Air Quality Risk Classification and Environmental Analytics
echo           Powered by MongoDB, Scikit-Learn Machine Learning and React
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."
set ROOT_DIR=%CD%

echo [*] Root Directory: %ROOT_DIR%

:: Check Python Virtual Environment
set PYTHON_EXE=%ROOT_DIR%\ml-service\venv\Scripts\python.exe
if not exist "%PYTHON_EXE%" (
    echo [!] Warning: Dedicated venv python not found at %PYTHON_EXE%
    echo [*] Falling back to system python...
    set PYTHON_EXE=python
)

echo [*] Using Python: %PYTHON_EXE%

:: Check MongoDB Local Connection
echo [*] Checking MongoDB Community Server status on port 27017...
"%PYTHON_EXE%" -c "import pymongo; c = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000); c.admin.command('ping'); print('[+] MongoDB is Active and accepting connections.')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: MongoDB is not responding on mongodb://localhost:27017/
    echo     Please ensure the MongoDB service is running.
    echo     You can start it by running: net start MongoDB
    echo.
    pause
    exit /b 1
)

:: Start Flask REST API Backend
echo [*] Launching AirGuard Flask REST API Backend on http://localhost:5000...
start "AirGuard Flask Backend (Port 5000)" cmd /k "cd /d "%ROOT_DIR%" && "%PYTHON_EXE%" airguard\backend\app.py"

:: Wait for backend initialization using ping delay
ping 127.0.0.1 -n 4 >nul

:: Start React Vite Frontend
echo [*] Launching AirGuard React and Tailwind Frontend on http://localhost:5173...
start "AirGuard React Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%\client" && npm run dev"

:: Wait for Vite initialization
ping 127.0.0.1 -n 3 >nul

:: Automatically open browser
echo [*] Opening browser to http://localhost:5173...
start http://localhost:5173

echo.
echo ===============================================================================
echo [SUCCESS] AirGuard Platform is now ACTIVE and RUNNING!
echo ===============================================================================
echo.
echo  - REST API Backend:  http://localhost:5000
echo  - Interactive Web:   http://localhost:5173
echo  - Database:          mongodb://localhost:27017/airguardDB
echo.
echo NOTE: Two separate terminal windows have opened:
echo       1. "AirGuard Flask Backend (Port 5000)"
echo       2. "AirGuard React Frontend (Port 5173)"
echo       Keep those two windows open while using the web application.
echo.
echo To shut down AirGuard, simply close the Flask and React terminal windows.
echo ===============================================================================
echo.
pause
