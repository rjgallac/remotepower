const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const messageEl = document.getElementById('message');
const btnStart = document.getElementById('btnStart');
const btnShutdown = document.getElementById('btnShutdown');
const btnRefresh = document.getElementById('btnRefresh');

// Auto-check status every 30 seconds
let statusCheckInterval = setInterval(checkStatus, 30000);

// Check status on page load
checkStatus();

async function checkStatus() {
    try {
        statusIndicator.className = 'status-indicator checking';
        statusText.textContent = 'Checking...';
        btnStart.disabled = true;
        btnShutdown.disabled = true;
        btnRefresh.disabled = true;

        const response = await fetch('/api/status');
        const data = await response.json();

        statusIndicator.className = data.running 
            ? 'status-indicator running' 
            : 'status-indicator stopped';
        
        statusText.textContent = data.running ? '🟢 RUNNING' : '🔴 STOPPED';

        btnStart.disabled = data.running; // Disable start if already running
        btnShutdown.disabled = !data.running; // Disable shutdown if not running
        btnRefresh.disabled = false;

    } catch (error) {
        console.error('Status check failed:', error);
        statusIndicator.className = 'status-indicator stopped';
        statusText.textContent = '❓ UNKNOWN';
        showMessage('Failed to check status', 'error');
        btnRefresh.disabled = false;
    }
}

async function startLaptop() {
    if (!confirm('Send Wake-on-LAN signal to start the laptop?')) return;

    try {
        btnStart.disabled = true;
        showMessage('Sending WoL signal...', 'info');

        const response = await fetch('/api/start', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            showMessage('✓ WoL signal sent! Laptop should start in a few seconds.', 'success');
            setTimeout(checkStatus, 3000); // Check status after 3 seconds
        } else {
            showMessage('✗ Failed to send WoL signal: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Start failed:', error);
        showMessage('✗ Error: ' + error.message, 'error');
    } finally {
        btnStart.disabled = false;
    }
}

async function shutdownLaptop() {
    if (!confirm('Are you sure you want to shut down the laptop? This cannot be easily undone.')) return;

    try {
        btnShutdown.disabled = true;
        showMessage('Sending shutdown command...', 'info');

        const response = await fetch('/api/shutdown', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            showMessage('✓ Shutdown signal sent! Laptop will shut down shortly.', 'success');
            setTimeout(checkStatus, 5000); // Check status after 5 seconds
        } else {
            showMessage('✗ Failed to shutdown: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Shutdown failed:', error);
        showMessage('✗ Error: ' + error.message, 'error');
    } finally {
        btnShutdown.disabled = false;
    }
}

function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Clear status check interval when page unloads
window.addEventListener('beforeunload', () => {
    clearInterval(statusCheckInterval);
});