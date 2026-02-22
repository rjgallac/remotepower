@echo off
REM Remote Power Management - Startup Script for Windows

echo.
echo ========================================
echo  Remote Power Management Server
echo ========================================
echo.

REM Set default values
set SSH_USER=user
set LAPTOP_IP=192.168.1.220

REM Check if SSH key exists
if exist "%USERPROFILE%\.ssh\id_rsa" (
    echo [*] SSH key found at %USERPROFILE%\.ssh\id_rsa
    set SSH_KEY_PATH=%USERPROFILE%\.ssh\id_rsa
    echo [*] Using SSH key authentication
) else (
    echo [!] SSH key not found. You may be prompted for password.
    echo [*] To use key-based auth, create keys with: ssh-keygen -t rsa -b 4096
)

echo.
echo [*] Configuration:
echo     - Laptop IP: %LAPTOP_IP%
echo     - SSH User: %SSH_USER%
if defined SSH_KEY_PATH (
    echo     - SSH Key: %SSH_KEY_PATH%
) else (
    echo     - Using password authentication
)
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [!] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo [*] Starting server...
echo [*] Open http://localhost:3000 in your browser
echo.

REM Start the server
call npm start
pause
