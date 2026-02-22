// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const dgram = require('dgram');
const ping = require('ping');
const ssh2 = require('ssh2');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const LAPTOP_IP = '192.168.1.220';
const LAPTOP_MAC = '2C-FD-A1-8A-DC-81';
const SSH_USER = process.env.SSH_USER || 'user'; // Change this or set via environment variable
const SSH_PASSWORD = process.env.SSH_PASSWORD || ''; // Ideally use SSH keys instead
const SSH_KEY_PATH = process.env.SSH_KEY_PATH; // Optional: path to private key for authentication

app.use(express.json());
app.use(express.static('public'));

// Check laptop status via ping
app.get('/api/status', async (req, res) => {
  try {
    const results = await ping.promise.probe(LAPTOP_IP, {
      timeout: 2,
      extra: ['-w', '2000'] // Windows uses -w, Linux uses -W
    });
    
    const isRunning = results.alive;
    res.json({ 
      running: isRunning,
      ip: LAPTOP_IP,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error.message);
    res.status(500).json({ error: 'Failed to check status', running: false });
  }
});

// Helper function to create magic packet
function createMagicPacket(mac) {
  const macParts = mac.split('-').map(part => parseInt(part, 16));
  const packet = Buffer.alloc(102);
  
  // Fill first 6 bytes with 0xFF (header)
  for (let i = 0; i < 6; i++) {
    packet[i] = 0xFF;
  }
  
  // Fill remaining 96 bytes with MAC address (16 repetitions)
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 6; j++) {
      packet[6 + i * 6 + j] = macParts[j];
    }
  }
  
  console.log(`[WoL] Created magic packet for MAC: ${mac}`);
  console.log(`[WoL] Packet hex: ${packet.toString('hex').substring(0, 50)}...`);
  console.log(`[WoL] Packet size: ${packet.length} bytes`);
  
  return packet;
}

// Start laptop via Wake-on-LAN
app.post('/api/start', (req, res) => {
  try {
    // Try multiple broadcast addresses
    const broadcastAddresses = [
      '192.168.1.255',      // Local subnet broadcast
      '255.255.255.255',    // Global broadcast
      '192.168.1.220'       // Direct to laptop (some systems respond to this)
    ];
    
    const port = 9;
    
    // Create the magic packet
    const magicPacket = createMagicPacket(LAPTOP_MAC);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Send to multiple addresses for better compatibility
    broadcastAddresses.forEach((broadcastAddr) => {
      const client = dgram.createSocket('udp4');
      
      // Bind first (required before setting broadcast option)
      client.bind(0, () => {
        // Enable broadcast
        client.setBroadcast(true);
        
        // Send the magic packet
        client.send(magicPacket, 0, magicPacket.length, port, broadcastAddr, (err) => {
          if (err) {
            console.error(`[WoL] Error sending to ${broadcastAddr}: ${err.message}`);
            errorCount++;
          } else {
            console.log(`[WoL] ✓ Packet sent to ${broadcastAddr}:${port}`);
            successCount++;
          }
          client.close();
          
          // Send response after all packets are attempted
          if (successCount + errorCount === broadcastAddresses.length) {
            if (successCount > 0) {
              res.json({ 
                success: true, 
                message: `Wake-on-LAN signal sent to ${LAPTOP_IP} (${successCount}/${broadcastAddresses.length} addresses)`,
                mac: LAPTOP_MAC,
                details: `Packets sent to: ${broadcastAddresses.join(', ')}`
              });
            } else {
              res.status(500).json({ 
                success: false, 
                message: 'Failed to send WoL packets',
                error: `All ${errorCount} attempts failed`
              });
            }
          }
        });
      });
      
      client.on('error', (err) => {
        console.error(`[WoL] UDP socket error on ${broadcastAddr}: ${err.message}`);
        errorCount++;
        
        if (successCount + errorCount === broadcastAddresses.length) {
          res.status(500).json({ success: false, message: 'UDP socket error', error: err.message });
        }
      });
    });
    
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ success: false, message: 'Error sending WoL packet', error: error.message });
  }
});

// Shutdown laptop via SSH
app.post('/api/shutdown', (req, res) => {
  const conn = new ssh2.Client();
  
  conn.on('ready', () => {
    conn.exec('shutdown -h now', (err, stream) => {
      if (err) {
        console.error('SSH exec error:', err);
        conn.end();
        return res.status(500).json({ success: false, message: 'Failed to execute shutdown', error: err.message });
      }
      
      stream.on('end', () => {
        conn.end();
        console.log(`Shutdown command sent to ${LAPTOP_IP}`);
        res.json({ 
          success: true, 
          message: `Shutdown signal sent to ${LAPTOP_IP}`
        });
      });
      
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        conn.end();
        res.status(500).json({ success: false, message: 'Stream error', error: err.message });
      });
    });
  }).on('error', (err) => {
    console.error('SSH connection error:', err);
    res.status(500).json({ success: false, message: 'Failed to connect via SSH', error: err.message });
  }).connect({
    host: LAPTOP_IP,
    port: 22,
    username: SSH_USER,
    password: SSH_PASSWORD,
    privateKey: SSH_KEY_PATH ? require('fs').readFileSync(SSH_KEY_PATH) : undefined,
    readyTimeout: 5000,
    tryKeyboard: true
  });
});

app.listen(PORT, () => {
  console.log(`Remote Power Management Server running on http://localhost:${PORT}`);
  console.log(`Target Laptop: ${LAPTOP_IP} (${LAPTOP_MAC})`);
  console.log(`SSH User: ${SSH_USER}`);
});
