@echo off
TITLE AirGuard - Automated Test Suite Runner
COLOR 0B

echo ===============================================================================
echo                AIRGUARD AUTOMATED TEST SUITE RUNNER
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."
set ROOT_DIR=%CD%

set PYTHON_EXE=%ROOT_DIR%\ml-service\venv\Scripts\python.exe
if not exist "%PYTHON_EXE%" set PYTHON_EXE=python

echo [1/3] Executing MongoDB Operations and Aggregation Tests...
"%PYTHON_EXE%" airguard\backend\test_mongo_operations.py
if %ERRORLEVEL% NEQ 0 (
    echo [!] MongoDB test failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Executing Machine Learning Prediction Engine Tests...
"%PYTHON_EXE%" airguard\backend\test_prediction_engine.py
if %ERRORLEVEL% NEQ 0 (
    echo [!] Prediction Engine test failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Executing Flask REST API Endpoints Verification...
"%PYTHON_EXE%" airguard\backend\test_api_endpoints.py
if %ERRORLEVEL% NEQ 0 (
    echo [!] API Endpoints test failed!
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo [SUCCESS] ALL AIRGUARD VERIFICATION TEST SUITES PASSED (100%%)
echo ===============================================================================
pause
