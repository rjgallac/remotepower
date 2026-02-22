# Remote Power Management - Startup Script for Windows PowerShell

$ScriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $ScriptPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Remote Power Management Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set variables
$SSH_USER = "user"
$LAPTOP_IP = "192.168.1.220"
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa"

# Check SSH key
if (Test-Path $SSH_KEY_PATH) {
    Write-Host "[✓] SSH key found at $SSH_KEY_PATH" -ForegroundColor Green
    $env:SSH_KEY_PATH = $SSH_KEY_PATH
    Write-Host "[✓] Using SSH key authentication" -ForegroundColor Green
} else {
    Write-Host "[!] SSH key not found at $SSH_KEY_PATH" -ForegroundColor Yellow
    Write-Host "[!] You will need to provide SSH password or create keys" -ForegroundColor Yellow
}

# Display configuration
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  • Laptop IP: $LAPTOP_IP"
Write-Host "  • SSH User: $SSH_USER"
if ($env:SSH_KEY_PATH) {
    Write-Host "  • SSH Key: $($env:SSH_KEY_PATH)"
} else {
    Write-Host "  • Auth Method: Password (set \`$env:SSH_PASSWORD)"
}
Write-Host ""

# Set environment variable
$env:SSH_USER = $SSH_USER

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "[*] Starting server..." -ForegroundColor Green
Write-Host "[*] Open http://localhost:3000 in your browser" -ForegroundColor Green
Write-Host ""

# Start the server
npm start
