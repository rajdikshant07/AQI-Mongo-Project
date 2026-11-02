# AirGuard Platform Launcher (PowerShell)
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "               AIRGUARD ENVIRONMENTAL INTELLIGENCE PLATFORM                    " -ForegroundColor Green
Write-Host "    Intelligent Air Quality Risk Classification & Environmental Analytics     " -ForegroundColor White
Write-Host "          Powered by MongoDB, Scikit-Learn Machine Learning and React          " -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir
Write-Host "[*] Root Directory: $RootDir" -ForegroundColor Gray

# Python Virtual Environment
$PythonExe = Join-Path $RootDir "ml-service\venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    Write-Host "[!] Dedicated venv not found at $PythonExe. Using system python." -ForegroundColor Yellow
    $PythonExe = "python"
}
Write-Host "[*] Using Python: $PythonExe" -ForegroundColor Gray

# Check MongoDB
Write-Host "[*] Probing MongoDB connection on localhost:27017..." -ForegroundColor Gray
$MongoCheck = & $PythonExe -c "import pymongo; c = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000); c.admin.command('ping'); print('OK')" 2>$null
if ($MongoCheck -ne "OK") {
    Write-Host "[!] ERROR: MongoDB is not responding on port 27017." -ForegroundColor Red
    Write-Host "    Please ensure MongoDB Community Server is started (net start MongoDB or mongod)." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}
Write-Host "[+] MongoDB Community Server is ACTIVE and reachable." -ForegroundColor Green

# Start Backend
Write-Host "[*] Launching Flask REST API backend on port 5000..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k cd /d `"$RootDir`" && `"$PythonExe`" airguard\backend\app.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[*] Launching React Vite dev server on port 5173..." -ForegroundColor Cyan
$ClientDir = Join-Path $RootDir "client"
Start-Process cmd.exe -ArgumentList "/k cd /d `"$ClientDir`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "AirGuard is starting up!" -ForegroundColor Green
Write-Host " - Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host " - Frontend UI:  http://localhost:5173" -ForegroundColor White
Write-Host " - Database:     mongodb://localhost:27017/airguardDB" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
