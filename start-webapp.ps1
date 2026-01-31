# IDURAR CRM/ERP - Standalone Browser Launcher
# This script starts the backend and frontend servers and opens the app in a browser

Write-Host "Starting IDURAR CRM/ERP..." -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# Check if backend port (8888) is already in use
$backendPort = 8888
if (Test-Port -Port $backendPort) {
    Write-Host "Backend port $backendPort is already in use. Skipping backend startup." -ForegroundColor Yellow
    $backendRunning = $true
} else {
    $backendRunning = $false
}

# Check if frontend port (3000) is already in use
$frontendPort = 3000
if (Test-Port -Port $frontendPort) {
    Write-Host "Frontend port $frontendPort is already in use. Skipping frontend startup." -ForegroundColor Yellow
    $frontendRunning = $true
} else {
    $frontendRunning = $false
}

# Start backend server if not running
if (-not $backendRunning) {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    $backendPath = Join-Path $PSScriptRoot "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Minimized
    Write-Host "Backend server starting on port $backendPort..." -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# Start frontend server if not running
if (-not $frontendRunning) {
    Write-Host "Starting frontend server..." -ForegroundColor Cyan
    $frontendPath = Join-Path $PSScriptRoot "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Minimized
    Write-Host "Frontend server starting on port $frontendPort..." -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Wait for servers to be ready
Write-Host "Waiting for servers to be ready..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $backendReady = Test-Port -Port $backendPort
    $frontendReady = Test-Port -Port $frontendPort
    
    if ($backendReady -and $frontendReady) {
        Write-Host "Servers are ready!" -ForegroundColor Green
        break
    }
    
    $attempt++
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
}

if ($attempt -eq $maxAttempts) {
    Write-Host "`nWarning: Servers may not be fully ready yet" -ForegroundColor Yellow
}

# Open in default browser
$url = "http://localhost:$frontendPort"
Write-Host "`nOpening IDURAR CRM/ERP in browser..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Green

# Open in a new browser window (app mode for Chrome/Edge if available)
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if (Test-Path $chromePath) {
    Start-Process $chromePath -ArgumentList "--app=$url", "--new-window"
    Write-Host "Opened in Chrome (app mode)" -ForegroundColor Green
} elseif (Test-Path $edgePath) {
    Start-Process $edgePath -ArgumentList "--app=$url", "--new-window"
    Write-Host "Opened in Edge (app mode)" -ForegroundColor Green
} else {
    Start-Process $url
    Write-Host "Opened in default browser" -ForegroundColor Green
}

Write-Host "`nIDURAR CRM/ERP is now running!" -ForegroundColor Green
Write-Host "Backend: http://localhost:$backendPort" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in the server windows to stop the servers." -ForegroundColor Yellow
