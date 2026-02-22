# Quick Start Guide

## Prerequisites Setup (One-time)

### On Your Linux Laptop (192.168.1.220):

1. **Enable Wake-on-LAN in BIOS** - Enter BIOS and enable WoL/Wake on Ethernet

2. **Enable WoL in OS**:
   ```bash
   # Find your network interface name (e.g., eth0, enp3s0)
   ip link show
   
   # Enable WoL (replace eth0 with your interface)
   sudo ethtool -s eth0 wol g
   ```

3. **Make WoL permanent** (choose one):
   
   For systemd (most modern Linux):
   ```bash
   sudo bash -c 'echo "NIC_ADDRESS=eth0" > /etc/default/wake-on-lan'
   sudo bash -c 'cat > /etc/systemd/system/wol.service << EOF
   [Unit]
   Description=Wake on LAN
   After=network.target
   
   [Service]
   Type=oneshot
   ExecStart=/sbin/ethtool -s eth0 wol g
   
   [Install]
   WantedBy=multi-user.target
   EOF'
   sudo systemctl daemon-reload
   sudo systemctl enable wol.service
   ```

4. **Setup SSH** (already should be running):
   ```bash
   # Verify SSH is running
   sudo systemctl status ssh
   
   # Start if not running
   sudo systemctl start ssh
   ```

5. **Allow shutdown without password** (optional but recommended):
   ```bash
   sudo visudo
   # Add this line at the end:
   # %sudo ALL=(ALL) NOPASSWD: /sbin/shutdown, /sbin/poweroff, /sbin/halt
   ```

### On Your Computer (Running the App):

1. **Install Node.js** from https://nodejs.org/ (v14+)

2. **Generate SSH key pair** (if you don't have one):
   ```bash
   # PowerShell / Command Prompt
   ssh-keygen -t rsa -b 4096
   # Press Enter for all prompts to use defaults
   ```

3. **Copy your SSH key to the laptop**:
   ```bash
   # PowerShell
   $key = Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
   ssh user@192.168.1.220 "mkdir -p ~/.ssh; echo '$key' >> ~/.ssh/authorized_keys"
   ```

## Running the Application

### 1. Install Dependencies
```bash
cd c:\Users\rjgal\projects\remotepower
npm install
```

### 2. Configure Credentials

**Option A: Using SSH Keys** (Recommended):
```bash
# PowerShell
$env:SSH_USER="user"
$env:SSH_KEY_PATH="$env:USERPROFILE\.ssh\id_rsa"
npm start
```

**Option B: Using SSH Password**:
```bash
# PowerShell
$env:SSH_USER="user"
$env:SSH_PASSWORD="your_password"
npm start
```

### 3. Open Web Browser
- Go to: http://localhost:3000
- You should see the Remote Power Control interface

## Testing Steps

1. **Test Status Check**: Click "Check Status" - should show 🔴 STOPPED if laptop is off
2. **Test WoL**: Click "Start" - after ~10-30 seconds, status should change to 🟢 RUNNING
3. **Test SSH Connection**: Make sure you can SSH manually:
   ```bash
   ssh user@192.168.1.220
   exit
   ```
4. **Test Shutdown**: Click "Shutdown" - laptop should shut down

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| WoL packet sent but laptop doesn't wake | Enable WoL in BIOS, ensure connected via Ethernet (not WiFi) |
| SSH connection refused | Check IP is correct, verify SSH is running on laptop, check firewall |
| Status always shows "Unknown" | Ping manually: `ping 192.168.1.220` |
| Shutdown doesn't work | Verify user can run shutdown: `ssh user@192.168.1.220 "sudo shutdown -h now"` |

## Advanced: Run as Background Service

### Windows (Batch file):
Create `run-remotepower.bat`:
```batch
@echo off
cd c:\Users\rjgal\projects\remotepower
set SSH_USER=user
set SSH_KEY_PATH=%USERPROFILE%\.ssh\id_rsa
npm start
pause
```

### Linux/Mac (Systemd service):
Create `/etc/systemd/system/remotepower.service`:
```ini
[Unit]
Description=Remote Power Management Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/remotepower
ExecStart=/usr/bin/node server.js
Environment="SSH_USER=user"
Environment="SSH_KEY_PATH=/home/youruser/.ssh/id_rsa"
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable remotepower
sudo systemctl start remotepower
```

## Tips

- The web interface auto-refreshes status every 30 seconds
- Buttons are disabled when appropriate (can't start if already running, can't shutdown if not running)
- WoL typically takes 10-30 seconds to wake the laptop
- SSH shutdown is immediate once connection is established
