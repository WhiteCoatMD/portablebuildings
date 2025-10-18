// =======================================================================
// Google Business Profile Location Selector
// =======================================================================

async function openLocationSelector() {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        showToast('Please log in first', true);
        return;
    }

    const modal = document.getElementById('location-selector-modal');
    const locationList = document.getElementById('location-list');
    const locationLoading = document.getElementById('location-loading');
    const locationError = document.getElementById('location-error');

    if (!modal) return;

    // Show modal and loading state
    modal.style.display = 'flex';
    locationList.style.display = 'none';
    locationList.innerHTML = '';
    locationLoading.style.display = 'block';
    locationError.style.display = 'none';

    try {
        const response = await fetch(`/api/google-business/list-locations?userId=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        locationLoading.style.display = 'none';

        if (!data.success || !data.locations || data.locations.length === 0) {
            locationError.style.display = 'block';
            document.getElementById('location-error-message').textContent =
                data.error || 'No locations found for your account.';
            return;
        }

        // If only one location, hide the "Change Location" button
        if (data.locations.length === 1) {
            const changeBtn = document.getElementById('change-location-btn');
            if (changeBtn) changeBtn.style.display = 'none';
            closeLocationSelector();
            showToast('You only have one location - no need to change', false);
            return;
        }

        // Show change location button if multiple locations exist
        const changeBtn = document.getElementById('change-location-btn');
        if (changeBtn) changeBtn.style.display = 'inline-block';

        // Show location list
        locationList.style.display = 'flex';
        locationList.innerHTML = data.locations.map(location => {
            const name = (location.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const address = (location.address || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

            return `
            <div class="location-card" style="border: 2px solid #dee2e6; border-radius: 8px; padding: 1.25rem; cursor: pointer; transition: all 0.2s;"
                 onclick="selectLocation('${location.id}', '${name}', '${address}')">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: #2d3748; font-size: 1.1rem;">${location.name || 'Unnamed Location'}</h3>
                        ${location.address ? `<p style="margin: 0.25rem 0; color: #6c757d; font-size: 0.9rem;">📍 ${location.address}</p>` : ''}
                        ${location.phoneNumber ? `<p style="margin: 0.25rem 0; color: #6c757d; font-size: 0.9rem;">📞 ${location.phoneNumber}</p>` : ''}
                    </div>
                    <div style="color: #4285f4; font-size: 1.5rem;">→</div>
                </div>
            </div>
        `;
        }).join('');

        // Add hover effects
        const cards = locationList.querySelectorAll('.location-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = '#4285f4';
                card.style.backgroundColor = '#f0f7ff';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = '#dee2e6';
                card.style.backgroundColor = 'transparent';
            });
        });

    } catch (error) {
        console.error('Error loading locations:', error);
        locationLoading.style.display = 'none';
        locationError.style.display = 'block';
        document.getElementById('location-error-message').textContent =
            'Failed to load locations. Please try again.';
    }
}

async function selectLocation(locationId, locationName, locationAddress) {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        showToast('Please log in first', true);
        return;
    }

    try {
        const response = await fetch('/api/google-business/change-location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: user.id,
                locationId: locationId,
                locationName: locationName,
                locationAddress: locationAddress
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`✅ Location changed to: ${locationName}`);
            closeLocationSelector();
            // Reload connection status to show new location
            loadGoogleBusinessConnectionStatus();
        } else {
            showToast(`Failed to change location: ${data.error}`, true);
        }
    } catch (error) {
        console.error('Error changing location:', error);
        showToast('Failed to change location', true);
    }
}

function closeLocationSelector() {
    const modal = document.getElementById('location-selector-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export functions to window
window.openLocationSelector = openLocationSelector;
window.selectLocation = selectLocation;
window.closeLocationSelector = closeLocationSelector;
