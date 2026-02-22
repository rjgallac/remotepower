# Remote Power Management - Node.js

A simple web-based application to remotely start and shut down a Linux laptop using Wake-on-LAN (WoL) and SSH.

## Features

- 🌐 Beautiful web interface with real-time status
- 🚀 Wake-on-LAN to remotely boot the laptop
- ⏹️ SSH-based shutdown command
- 📡 Automatic status checking (ping)
- 🎨 Responsive design with status indicator

## Requirements

### Linux Laptop (Target)
1. **Wake-on-LAN enabled** in BIOS/UEFI settings
2. **SSH server running** (openssh-server)
3. **Wake capability** in network driver settings

### Your Computer (Running the Server)
- Node.js (v14 or higher)
- Network access to the target laptop's IP and SSH port

## Installation

1. Clone or extract this repository
2. Install dependencies:
```bash
npm install
```

## Configuration

### 1. Enable Wake-on-LAN on Linux Laptop

On the target Linux machine, check if WoL is enabled:
```bash
ethtool eth0  # Replace eth0 with your network interface
# Look for "Wake-on: g" (g = magic packet)
```

If not enabled, enable it:
```bash
sudo ethtool -s eth0 wol g
```

Make it permanent (add to `/etc/network/interfaces` or use netplan):
```bash
# For netplan (Ubuntu 18.04+), edit /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      wakeonlan: true
      dhcp4: true
```

### 2. Get the Laptop's MAC Address

On the target Linux machine:
```bash
ip link show  # or ifconfig
# Look for "link/ether XX:XX:XX:XX:XX:XX"
```

The MAC address in your case: `2C-FD-A1-8A-DC-81`

### 3. Setup SSH Access

You have two options:

**Option A: SSH Keys (Recommended)**
```bash
# On your computer, generate a key pair if you don't have one
ssh-keygen -t rsa -b 4096

# Copy public key to the laptop
ssh-copy-id -i ~/.ssh/id_rsa.pub user@192.168.1.220
```

Then set environment variable:
```bash
# Windows PowerShell
$env:SSH_KEY_PATH="C:\Users\YourUsername\.ssh\id_rsa"

# Linux/Mac
export SSH_KEY_PATH=~/.ssh/id_rsa
```

**Option B: SSH Password**
```bash
# Windows PowerShell
$env:SSH_USER="user"
$env:SSH_PASSWORD="password"

# Linux/Mac
export SSH_USER="user"
export SSH_PASSWORD="password"
```

### 4. Update Server Configuration (Optional)

Edit `server.js` and update these constants if needed:
```javascript
const LAPTOP_IP = '192.168.1.220';      // Target laptop IP
const LAPTOP_MAC = '2C-FD-A1-8A-DC-81'; // Target laptop MAC
const SSH_USER = 'user';                 // SSH username
```

## Usage

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### Keep the Server Running with PM2 (Recommended)

For production use, keep the server running continuously with [PM2](https://pm2.keymetrics.io/):

**1. Install PM2 globally:**
```bash
npm install -g pm2
```

**2. Start the app with PM2:**

Option A - Using the ecosystem config (recommended):
```bash
pm2 start ecosystem.config.js
```

Option B - Quick start:
```bash
pm2 start server.js --name remotepower
```

**3. Make PM2 restart on system boot:**
```bash
# Windows (Admin PowerShell)
pm2 install pm2-windows-startup
pm2 save

# Linux/Mac
pm2 startup
pm2 save
```

**4. Useful PM2 commands:**
```bash
# View running processes
pm2 list

# Check logs
pm2 logs remotepower

# Stop the app
pm2 stop remotepower

# Restart the app
pm2 restart remotepower

# Delete from PM2
pm2 delete remotepower

# Monitor in real-time
pm2 monit
```

**5. Configuration:**
The `ecosystem.config.js` file contains PM2 configuration including:
- Auto-restart on crashes
- Memory limit: 200MB
- Logging to `./logs/` directory
- Watch mode disabled (can be enabled for development)

### Use the Web Interface

1. Open your browser and go to `http://localhost:3000`
2. You'll see the current status of the laptop
3. Click **Start** to send a Wake-on-LAN signal
4. Click **Shutdown** to remotely shut down the laptop
5. Status updates automatically every 30 seconds

## API Endpoints

- **GET `/api/status`** - Check if laptop is running (returns JSON with `running` boolean)
- **POST `/api/start`** - Send WoL packet to start the laptop
- **POST `/api/shutdown`** - Send SSH shutdown command

## Troubleshooting

### WoL not working?
- Verify Wake-on-LAN is enabled in BIOS/UEFI
- Check network interface settings: `ethtool eth0 | grep Wake`
- Ensure laptop is connected via Ethernet (WoL over WiFi doesn't work on most systems)
- Try waking from the same network: `wakeonlan 2C-FD-A1-8A-DC-81`

### SSH shutdown not working?
- Verify SSH access: `ssh user@192.168.1.220 echo "SSH works"`
- Check if user has sudo privileges: `ssh user@192.168.1.220 sudo -l`
- Make sure the user can run shutdown without password (add to sudoers if needed):
  ```bash
  sudo visudo
  # Add this line:
  user ALL=(ALL) NOPASSWD: /sbin/shutdown
  ```
- Then change the command in `server.js` to use `sudo shutdown -h now`

### Status shows "Unknown"?
- Check if laptop IP is correct
- Ensure firewall allows ping/ICMP from your computer
- The laptop might be in a state where it responds to ping but SSH is not ready

### Can't connect via SSH?
- Verify IP address and port 22 is open
- Check SSH credentials
- Ensure SSH server is running on the laptop: `sudo systemctl status ssh`

## Security Notes

- This application is designed for use on a local network only
- Avoid using passwords in environment variables in production
- Use SSH keys for authentication instead of passwords
- Consider running the server behind a firewall or VPN if accessing remotely
- Never expose this service directly to the internet without proper security

## Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + CSS3 + JavaScript
- **WoL**: wake-on-lan npm package
- **SSH**: ssh2 npm package
- **Ping**: ping npm package

## License

MIT

## Author Notes

This project is perfect for:
- Saving energy by remotely powering down computers
- Starting a remote workstation from bed/couch
- Automating startup schedules (pair with cron jobs or Task Scheduler)
