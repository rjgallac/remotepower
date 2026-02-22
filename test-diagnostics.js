#!/usr/bin/env node

/**
 * Diagnostic Tool for Remote Power Management
 * Run this to diagnose connectivity and configuration issues
 */

const ping = require('ping');
const ssh2 = require('ssh2');
const wol = require('wake-on-lan');
const fs = require('fs');
const path = require('path');

const LAPTOP_IP = process.env.LAPTOP_IP || '192.168.1.220';
const LAPTOP_MAC = process.env.LAPTOP_MAC || '2C-FD-A1-8A-DC-81';
const SSH_USER = process.env.SSH_USER || 'user';
const SSH_PASSWORD = process.env.SSH_PASSWORD || '';
const SSH_KEY_PATH = process.env.SSH_KEY_PATH;

console.log('\n' + '='.repeat(50));
console.log('Remote Power Management - Diagnostic Tool');
console.log('='.repeat(50) + '\n');

console.log('Configuration:');
console.log(`  Laptop IP: ${LAPTOP_IP}`);
console.log(`  Laptop MAC: ${LAPTOP_MAC}`);
console.log(`  SSH User: ${SSH_USER}`);
console.log(`  SSH Auth: ${SSH_KEY_PATH ? 'SSH Key (' + SSH_KEY_PATH + ')' : SSH_PASSWORD ? 'Password' : 'NOT CONFIGURED'}`);
console.log('\n');

let testsCompleted = 0;
let testsPassed = 0;

function log(test, passed, message) {
    testsCompleted++;
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`${color}[${status}]${reset} ${test}: ${message}`);
    if (passed) testsPassed++;
}

// Test 1: Check Node.js dependencies
console.log('Test 1: Checking dependencies...');
try {
    require('wake-on-lan');
    require('ping');
    require('ssh2');
    log('Dependencies', true, 'All required packages installed');
} catch (e) {
    log('Dependencies', false, `Missing package: ${e.message}`);
}

// Test 2: Test Ping
(async () => {
    console.log('\nTest 2: Testing network connectivity (ping)...');
    try {
        const result = await ping.promise.probe(LAPTOP_IP, {
            timeout: 2,
            extra: ['-w', '2000']
        });
        log('Ping', result.alive, result.alive ? `Laptop is reachable (${result.time}ms)` : 'Laptop is not responding to ping');
    } catch (e) {
        log('Ping', false, `Ping failed: ${e.message}`);
    }

    // Test 3: SSH Configuration
    console.log('\nTest 3: Checking SSH configuration...');
    if (!SSH_USER) {
        log('SSH Config', false, 'SSH_USER not set');
    } else {
        log('SSH Config', true, `SSH_USER is set to "${SSH_USER}"`);
    }

    if (SSH_KEY_PATH) {
        if (fs.existsSync(SSH_KEY_PATH)) {
            log('SSH Key', true, `SSH key exists at ${SSH_KEY_PATH}`);
        } else {
            log('SSH Key', false, `SSH key not found at ${SSH_KEY_PATH}`);
        }
    } else if (SSH_PASSWORD) {
        log('SSH Auth', true, 'SSH password is configured');
    } else {
        log('SSH Auth', false, 'Neither SSH_KEY_PATH nor SSH_PASSWORD configured');
    }

    // Test 4: SSH Connection
    console.log('\nTest 4: Testing SSH connection...');
    if (!SSH_USER) {
        log('SSH Connection', false, 'Cannot test - SSH_USER not configured');
    } else {
        const conn = new ssh2.Client();
        
        conn.on('ready', () => {
            log('SSH Connection', true, `Successfully connected to ${LAPTOP_IP} as ${SSH_USER}`);
            
            // Test executing a command
            conn.exec('whoami', (err, stream) => {
                if (err) {
                    log('SSH Command', false, `Failed to execute command: ${err.message}`);
                    conn.end();
                    
                    // Test 5: WoL
                    console.log('\nTest 5: Testing Wake-on-LAN...');
                    try {
                        wol.wake(LAPTOP_MAC, {}, (error) => {
                            log('WoL', !error, error ? `WoL failed: ${error.message}` : `WoL packet sent to ${LAPTOP_MAC}`);
                            
                            // Summary
                            console.log('\n' + '='.repeat(50));
                            console.log(`Tests Passed: ${testsPassed}/${testsCompleted}`);
                            console.log('='.repeat(50) + '\n');
                            
                            if (testsPassed === testsCompleted) {
                                console.log('✓ All tests passed! System is ready.');
                            } else {
                                console.log('✗ Some tests failed. Please review the output above.');
                            }
                        });
                    } catch (e) {
                        log('WoL', false, `WoL error: ${e.message}`);
                    }
                } else {
                    let output = '';
                    stream.on('data', (data) => {
                        output += data.toString();
                    });
                    stream.on('end', () => {
                        log('SSH Command', true, `Command executed successfully (whoami output: ${output.trim()})`);
                        conn.end();
                        
                        // Test 5: WoL
                        console.log('\nTest 5: Testing Wake-on-LAN...');
                        try {
                            wol.wake(LAPTOP_MAC, {}, (error) => {
                                log('WoL', !error, error ? `WoL failed: ${error.message}` : `WoL packet sent to ${LAPTOP_MAC}`);
                                
                                // Summary
                                console.log('\n' + '='.repeat(50));
                                console.log(`Tests Passed: ${testsPassed}/${testsCompleted}`);
                                console.log('='.repeat(50) + '\n');
                                
                                if (testsPassed === testsCompleted) {
                                    console.log('✓ All tests passed! System is ready.');
                                } else {
                                    console.log('✗ Some tests failed. Please review the output above.');
                                }
                            });
                        } catch (e) {
                            log('WoL', false, `WoL error: ${e.message}`);
                        }
                    });
                }
            });
        }).on('error', (err) => {
            log('SSH Connection', false, `${err.message}`);
            
            // Test 5: WoL
            console.log('\nTest 5: Testing Wake-on-LAN...');
            try {
                wol.wake(LAPTOP_MAC, {}, (error) => {
                    log('WoL', !error, error ? `WoL failed: ${error.message}` : `WoL packet sent to ${LAPTOP_MAC}`);
                    
                    // Summary
                    console.log('\n' + '='.repeat(50));
                    console.log(`Tests Passed: ${testsPassed}/${testsCompleted}`);
                    console.log('='.repeat(50) + '\n');
                    
                    if (testsPassed === testsCompleted) {
                        console.log('✓ All tests passed! System is ready.');
                    } else {
                        console.log('✗ Some tests failed. Please review the output above.');
                        process.exit(1);
                    }
                });
            } catch (e) {
                log('WoL', false, `WoL error: ${e.message}`);
            }
        }).connect({
            host: LAPTOP_IP,
            port: 22,
            username: SSH_USER,
            password: SSH_PASSWORD,
            privateKey: SSH_KEY_PATH ? fs.readFileSync(SSH_KEY_PATH) : undefined,
            readyTimeout: 5000
        });
    }
})();
