// Manual refresh Google Business info
async function refreshGoogleInfo() {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        showToast('Please log in first', true);
        return;
    }

    showToast('Refreshing Google Business info...');

    const accountElement = document.getElementById('connected-gbp-account');
    const locationElement = document.getElementById('connected-gbp-location');

    if (accountElement) accountElement.textContent = 'Refreshing...';
    if (locationElement) locationElement.textContent = 'Refreshing...';

    try {
        const response = await fetch('/api/google-business/refresh-account-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user.id })
        });

        const data = await response.json();

        console.log('[Refresh Google] Response:', data);

        if (data.success && data.connection) {
            if (accountElement) accountElement.textContent = data.connection.accountName || 'Unknown Account';
            if (locationElement) locationElement.textContent = data.connection.locationName || 'Unknown Location';
            showToast('✅ Google Business info refreshed');

            // Reload to check for multiple locations
            loadGoogleBusinessConnectionStatus();
        } else {
            if (accountElement) accountElement.textContent = 'Error loading';
            if (locationElement) locationElement.textContent = 'Error loading';

            // Show detailed error
            const errorMsg = data.details || data.error || 'Unknown error';
            showToast(`❌ ${errorMsg}`, true);
            console.error('[Refresh Google] Full error:', data);

            // Alert with full error for debugging
            alert(`Google API Error:\n\n${errorMsg}\n\nStatus: ${data.status || 'Unknown'}\n\nCheck console for details.`);
        }
    } catch (error) {
        console.error('[Refresh Google] Error:', error);
        if (accountElement) accountElement.textContent = 'Error';
        if (locationElement) locationElement.textContent = 'Error';
        showToast('Failed to refresh Google Business info', true);
    }
}

window.refreshGoogleInfo = refreshGoogleInfo;
