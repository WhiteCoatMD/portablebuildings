/**
 * Admin Panel JavaScript
 * Handles all admin functionality
 */

// Storage keys
const STORAGE_KEYS = {
    SETTINGS: 'cpb_admin_settings',
    WELCOME: 'cpb_welcome_message',
    CAROUSEL: 'cpb_carousel_images',
    BUILDINGS: 'cpb_building_overrides',
    LOTS: 'cpb_other_lots',
    COLOR_SCHEME: 'cpb_color_scheme',
    BUSINESS_NAME: 'cpb_business_name',
    BUSINESS_PHONE: 'cpb_business_phone',
    BUSINESS_EMAIL: 'cpb_business_email',
    BUSINESS_ADDRESS: 'cpb_business_address',
    BUTTON_COLOR: 'cpb_button_color',
    SOCIAL_MEDIA: 'cpb_social_media',
    FACEBOOK_CONFIG: 'cpb_facebook_config',
    POSTED_BUILDINGS: 'cpb_posted_buildings',
    CUSTOM_COLORS: 'cpb_custom_colors'
};

// Default settings
const DEFAULT_SETTINGS = {
    showCashPrice: true,
    showRtoOptions: true
};

const DEFAULT_WELCOME = {
    title: 'Welcome to Community Portable Buildings of West Monroe, LA and Columbia, LA',
    message: 'Take a look at what we have in stock, and let us know if we can design you a custom Graceland Building or help in any way!'
};

const DEFAULT_CAROUSEL = [
    'Cabin-12x24-Angle.jpg',
    'BARN-ANGLED-8x12.jpg',
    'Corner-Porch-Cabin.png',
    'GHP-6307.jpg',
    'Side-Lofted-Barn-10X16-Front-Angled.png',
    'Mini-Closed.png'
];

// Admin building filters
let buildingFilters = {
    search: '',
    status: 'all',
    type: 'all'
};

// Sync server configuration
const SYNC_SERVER_URL = 'http://localhost:3001';

// Authentication helpers
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        return null;
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('Auth check failed:', error);
        return null;
    }
}

function logout() {
    // Clear ALL localStorage to prevent data leaking between users
    localStorage.clear();

    // Also clear any in-memory cached data
    dbCache = {
        settings: null,
        overrides: null,
        imageOrders: null
    };

    // Clear the global inventory reference
    if (window.PROCESSED_INVENTORY) {
        window.PROCESSED_INVENTORY = [];
    }

    window.location.href = 'login.html';
}

// View Site from header
function viewSiteFromHeader(event) {
    if (event) event.preventDefault();

    const user = window.currentUser;
    if (!user) {
        alert('User information not loaded');
        return;
    }

    if (!user.subdomain) {
        alert('Please set up your subdomain in the Domain & Website tab first');
        return;
    }

    const url = user.custom_domain && user.domain_verified
        ? `https://${user.custom_domain}`
        : `https://${user.subdomain}.shed-sync.com`;

    window.open(url, '_blank');
}

// Update View Site link URL
function updateViewSiteLink() {
    const user = window.currentUser;
    if (!user) return;

    const viewSiteLink = document.getElementById('view-site-link');
    if (!viewSiteLink) return;

    if (user.subdomain) {
        const url = user.custom_domain && user.domain_verified
            ? `https://${user.custom_domain}`
            : `https://${user.subdomain}.shed-sync.com`;

        viewSiteLink.href = url;
    } else {
        viewSiteLink.href = '#';
        viewSiteLink.title = 'Please set up your subdomain first';
    }
}

// Database API helpers
let dbCache = {
    settings: null,
    overrides: null,
    imageOrders: null
};

async function loadFromDatabase() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        // Load all data in parallel
        const [settingsRes, overridesRes, imageOrdersRes] = await Promise.all([
            fetch('/api/user/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/user/building-overrides', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/user/image-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const [settingsData, overridesData, imageOrdersData] = await Promise.all([
            settingsRes.json(),
            overridesRes.json(),
            imageOrdersRes.json()
        ]);

        if (settingsData.success) dbCache.settings = settingsData.settings;
        if (overridesData.success) dbCache.overrides = overridesData.overrides;
        if (imageOrdersData.success) dbCache.imageOrders = imageOrdersData.orders;

        console.log('Loaded from database:', dbCache);
    } catch (error) {
        console.error('Failed to load from database:', error);
    }
}

async function saveToDatabase(type, data) {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const endpoints = {
        settings: '/api/user/settings',
        overrides: '/api/user/building-overrides',
        imageOrders: '/api/user/image-orders'
    };

    const bodyKeys = {
        settings: 'settings',
        overrides: 'overrides',
        imageOrders: 'orders'
    };

    try {
        const response = await fetch(endpoints[type], {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [bodyKeys[type]]: data })
        });

        const result = await response.json();
        if (!result.success) {
            console.error('Failed to save to database:', result.error);
        }
    } catch (error) {
        console.error('Failed to save to database:', error);
    }
}

// Helper to get settings with fallback to localStorage
function getSetting(key, defaultValue = null) {
    // Try database cache first
    if (dbCache.settings && dbCache.settings[key] !== undefined) {
        return dbCache.settings[key];
    }
    // Fallback to localStorage
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return stored;
        }
    }
    return defaultValue;
}

// Helper to save setting to both database and localStorage (for backwards compat)
async function saveSetting(key, value) {
    // Save to localStorage for backwards compatibility
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, valueStr);

    // Update cache
    if (!dbCache.settings) dbCache.settings = {};
    dbCache.settings[key] = value;

    // Save to database
    await saveToDatabase('settings', { [key]: value });
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and show user info
    const user = await checkAuth();
    if (user) {
        // Check if this is a different user than last time
        const lastUser = localStorage.getItem('cpb_last_user');
        if (lastUser && lastUser !== user.email) {
            // Different user - clear all localStorage to prevent data leaking
            console.log('Different user detected, clearing localStorage');
            const token = localStorage.getItem('auth_token'); // Save token
            localStorage.clear();
            localStorage.setItem('auth_token', token); // Restore token
            localStorage.setItem('cpb_last_user', user.email);

            // Clear in-memory caches
            dbCache = {
                settings: null,
                overrides: null,
                imageOrders: null
            };

            // Clear the global inventory reference
            if (window.PROCESSED_INVENTORY) {
                window.PROCESSED_INVENTORY = [];
            }
        } else if (!lastUser) {
            // First login - store the user
            localStorage.setItem('cpb_last_user', user.email);
        }

        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }

        // Update manufacturer display in header
        const userManufacturerEl = document.getElementById('user-manufacturer');
        if (userManufacturerEl && user.manufacturer) {
            const manufacturerName = user.manufacturer === 'graceland' ? 'Graceland Dealer' : 'Premier Dealer';
            userManufacturerEl.textContent = manufacturerName;
        }

        // Update profile information in Account Settings tab
        const profileBusinessName = document.getElementById('profile-business-name');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        const profileManufacturer = document.getElementById('profile-manufacturer');

        if (profileBusinessName) profileBusinessName.textContent = user.businessName || user.email;
        if (profileEmail) profileEmail.textContent = user.email;
        if (profilePhone) profilePhone.textContent = user.phone || 'Not set';
        if (profileManufacturer) {
            const fullManufacturerName = user.manufacturer === 'graceland'
                ? 'Graceland Portable Buildings'
                : 'Premier Portable Buildings';
            profileManufacturer.textContent = fullManufacturerName;
        }

        // Update View Site link
        updateViewSiteLink();

        // Show super admin link if user is admin
        if (user.is_admin) {
            const superAdminLink = document.getElementById('super-admin-link');
            if (superAdminLink) {
                superAdminLink.style.display = 'inline-block';
            }
        }

        // Check multi-lot feature flag
        const multiLotEnabled = user.features && user.features.multiLot;
        const multiLotDisabledDiv = document.getElementById('multi-lot-disabled');
        const multiLotEnabledDiv = document.getElementById('multi-lot-enabled');

        if (multiLotEnabled) {
            // Show the form
            if (multiLotEnabledDiv) multiLotEnabledDiv.style.display = 'block';
            if (multiLotDisabledDiv) multiLotDisabledDiv.style.display = 'none';
        } else {
            // Show the contact message
            if (multiLotDisabledDiv) multiLotDisabledDiv.style.display = 'block';
            if (multiLotEnabledDiv) multiLotEnabledDiv.style.display = 'none';
        }

        // Store user info for business profile loading
        window.currentUser = user;
    }

    // Load data from database first
    await loadFromDatabase();

    initializeTabs();
    loadSettings();
    loadWelcomeMessage();
    loadCarousel();
    loadColorScheme();
    loadBusinessInfo(); // Now will use window.currentUser
    loadSocialMedia();
    loadSubscriptionInfo();
    loadFacebookConfig();
    loadFacebookConnectionStatus(); // Check Facebook OAuth connection status
    loadGoogleBusinessConnectionStatus(); // Check Google Business Profile OAuth connection status
    loadButtonColor();
    initializeColorInputSync();
    initializeBackgroundColorPicker();
    initializeCustomColorPickers();
    loadLocationHours();
    loadLots();
    loadBuildings();
    initializeBuildingFilters();
    loadGpbCredentials();
    // loadDomainInfo will be called when user switches to domain tab
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load domain info when switching to domain tab
    if (tabName === 'domain') {
        loadDomainInfo();
    }
}

// Bubble button settings state
const bubbleSettings = {
    showCashPrice: true,
    showRtoOptions: true,
    repoSortOrder: 'last',
    repoPriceDisplay: 'strikethrough',
    soldBuildingBehavior: 'auto-delete'
};

// Handle bubble button selection
function selectBubble(buttonElement, settingName, value) {
    // Update the state
    bubbleSettings[settingName] = value;

    // Remove active class from all buttons in this group
    const allButtons = document.querySelectorAll(`[data-setting="${settingName}"]`);
    allButtons.forEach(btn => btn.classList.remove('active'));

    // Add active class to clicked button
    buttonElement.classList.add('active');
}

// Settings Management
function loadSettings() {
    const settings = getSettings();

    // Load values into bubble settings state
    bubbleSettings.showCashPrice = settings.showCashPrice ?? true;
    bubbleSettings.showRtoOptions = settings.showRtoOptions ?? true;
    bubbleSettings.repoSortOrder = settings.repoSortOrder || 'last';
    bubbleSettings.repoPriceDisplay = settings.repoPriceDisplay || 'strikethrough';
    bubbleSettings.soldBuildingBehavior = settings.soldBuildingBehavior || 'auto-delete';

    // Update UI - set active states on bubble buttons
    updateBubbleButtons();
}

function updateBubbleButtons() {
    // Update each setting's bubble buttons
    for (const [settingName, value] of Object.entries(bubbleSettings)) {
        const buttons = document.querySelectorAll(`[data-setting="${settingName}"]`);
        buttons.forEach(btn => {
            const btnValue = btn.getAttribute('data-value');
            // Convert string values to proper types for comparison
            let compareValue = value;
            if (btnValue === 'true') compareValue = true;
            else if (btnValue === 'false') compareValue = false;

            if (btnValue == compareValue) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

function getSettings() {
    return getSetting(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

// Save Account Settings (Display toggles only)
async function saveSettings() {
    const currentSettings = getSettings();
    const settings = {
        ...currentSettings,
        showCashPrice: document.getElementById('showCashPrice').checked,
        showRtoOptions: document.getElementById('showRtoOptions').checked
    };

    await saveSetting(STORAGE_KEYS.SETTINGS, settings);
    showToast('Settings saved successfully!');
}

// Save Inventory Settings (All display and inventory options)
async function saveInventorySettings() {
    const currentSettings = getSettings();

    // Get values from bubble settings
    const settings = {
        ...currentSettings,
        showCashPrice: bubbleSettings.showCashPrice,
        showRtoOptions: bubbleSettings.showRtoOptions,
        repoSortOrder: bubbleSettings.repoSortOrder,
        repoPriceDisplay: bubbleSettings.repoPriceDisplay,
        soldBuildingBehavior: bubbleSettings.soldBuildingBehavior
    };

    await saveSetting(STORAGE_KEYS.SETTINGS, settings);
    showToast('Inventory settings saved successfully!');
}

// Password Change
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const statusEl = document.getElementById('password-change-status');

    // Clear previous status
    statusEl.textContent = '';
    statusEl.style.color = '';

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        statusEl.textContent = 'Please fill in all fields';
        statusEl.style.color = '#e74c3c';
        return;
    }

    if (newPassword.length < 8) {
        statusEl.textContent = 'New password must be at least 8 characters long';
        statusEl.style.color = '#e74c3c';
        return;
    }

    if (newPassword !== confirmPassword) {
        statusEl.textContent = 'New passwords do not match';
        statusEl.style.color = '#e74c3c';
        return;
    }

    if (currentPassword === newPassword) {
        statusEl.textContent = 'New password must be different from current password';
        statusEl.style.color = '#e74c3c';
        return;
    }

    try {
        statusEl.textContent = 'Changing password...';
        statusEl.style.color = '#3498db';

        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            statusEl.textContent = 'Password changed successfully!';
            statusEl.style.color = '#27ae60';

            // Clear the form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';

            showToast('Password changed successfully!');
        } else {
            statusEl.textContent = data.error || 'Failed to change password';
            statusEl.style.color = '#e74c3c';
        }
    } catch (error) {
        console.error('Error changing password:', error);
        statusEl.textContent = 'Error changing password. Please try again.';
        statusEl.style.color = '#e74c3c';
    }
}

// Welcome Message Management
function loadWelcomeMessage() {
    const welcome = getWelcomeMessage();
    document.getElementById('welcomeTitle').value = welcome.title;
    document.getElementById('welcomeMessage').value = welcome.message;
}

function getWelcomeMessage() {
    // Check if user has saved a custom welcome message
    const saved = getSetting(STORAGE_KEYS.WELCOME, null);

    if (saved) {
        return saved;
    }

    // Generate default welcome message using user's business name
    const user = window.currentUser;
    const businessName = user?.business_name || user?.businessName || 'Your Business';

    return {
        title: `Welcome to ${businessName}`,
        message: `Browse our inventory of quality portable buildings. Contact us if you have any questions or would like to schedule a visit!`
    };
}

async function saveWelcomeMessage() {
    const welcome = {
        title: document.getElementById('welcomeTitle').value,
        message: document.getElementById('welcomeMessage').value
    };

    await saveSetting(STORAGE_KEYS.WELCOME, welcome);
    showToast('Welcome message saved successfully!');
}

// Carousel Management
function loadCarousel() {
    const images = getCarouselImages();
    const container = document.getElementById('carousel-images');

    container.innerHTML = images.map((img, index) => `
        <div class="carousel-item" draggable="true" data-index="${index}">
            <button class="carousel-item-remove" onclick="removeCarouselImage(${index})" title="Remove">×</button>
            <img src="${img}" alt="Carousel ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27120%27%3E%3Crect fill=%27%23ddd%27 width=%27200%27 height=%27120%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 fill=%27%23999%27%3EImage not found%3C/text%3E%3C/svg%3E'">
            <div class="carousel-item-name">${img}</div>
        </div>
    `).join('');

    // Add drag and drop
    addDragAndDrop();
}

function getCarouselImages() {
    return getSetting(STORAGE_KEYS.CAROUSEL, DEFAULT_CAROUSEL);
}

async function addCarouselImage() {
    const input = document.getElementById('newCarouselImage');
    const imageName = input.value.trim();

    if (!imageName) {
        showToast('Please enter an image filename', true);
        return;
    }

    const images = getCarouselImages();
    images.push(imageName);
    await saveSetting(STORAGE_KEYS.CAROUSEL, images);

    input.value = '';
    loadCarousel();
    showToast('Image added to carousel!');
}

async function removeCarouselImage(index) {
    if (!confirm('Remove this image from the carousel?')) return;

    const images = getCarouselImages();
    images.splice(index, 1);
    await saveSetting(STORAGE_KEYS.CAROUSEL, images);

    loadCarousel();
    showToast('Image removed from carousel!');
}

function saveCarousel() {
    showToast('Carousel saved successfully!');
}

// Drag and Drop for Carousel
function addDragAndDrop() {
    const items = document.querySelectorAll('.carousel-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedItem !== item) {
                const images = getCarouselImages();
                const draggedIndex = parseInt(draggedItem.dataset.index);
                const targetIndex = parseInt(item.dataset.index);

                // Swap images
                [images[draggedIndex], images[targetIndex]] = [images[targetIndex], images[draggedIndex]];

                await saveSetting(STORAGE_KEYS.CAROUSEL, images);
                loadCarousel();
            }
        });
    });
}

// Building Filter Initialization
function initializeBuildingFilters() {
    const searchInput = document.getElementById('building-search');
    const statusFilter = document.getElementById('building-status-filter');
    const typeFilter = document.getElementById('building-type-filter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            buildingFilters.search = e.target.value.toLowerCase();
            loadBuildings();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            buildingFilters.status = e.target.value;
            loadBuildings();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            buildingFilters.type = e.target.value;
            loadBuildings();
        });
    }
}

// Get user's inventory from database
async function getUserInventory() {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];

    try {
        const response = await fetch('/api/user/inventory', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            return data.inventory;
        }
        return [];
    } catch (error) {
        console.error('Failed to load inventory:', error);
        return [];
    }
}

// Buildings Management
async function loadBuildings() {
    // Load inventory from database instead of inventory.js
    const inventory = await getUserInventory();

    // Store in global variable for other functions (like loadLots)
    window.PROCESSED_INVENTORY = inventory;

    const overrides = getBuildingOverrides();
    const container = document.getElementById('buildings-list');

    if (inventory.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>No buildings in your inventory</h3>
                <p style="margin: 1rem 0; color: #666;">Import your inventory to get started</p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="showCSVUpload()">📄 Upload CSV File</button>
                    <p style="width: 100%; color: #999; font-size: 0.9rem;">Export your inventory from GPB Sales as CSV and upload it here</p>
                </div>
            </div>
        `;
        return;
    }

    // Apply filters
    const filteredBuildings = inventory.filter(building => {
        const override = overrides[building.serialNumber] || {};
        const status = override.status || 'available';
        const isHidden = override.hidden || false;

        // Search filter
        if (buildingFilters.search) {
            const searchText = buildingFilters.search;
            const matches =
                building.serialNumber.toLowerCase().includes(searchText) ||
                building.sizeDisplay.toLowerCase().includes(searchText) ||
                building.title.toLowerCase().includes(searchText) ||
                building.typeName.toLowerCase().includes(searchText);

            if (!matches) return false;
        }

        // Status filter
        if (buildingFilters.status !== 'all') {
            if (buildingFilters.status === 'hidden' && !isHidden) return false;
            if (buildingFilters.status !== 'hidden' && status !== buildingFilters.status) return false;
        }

        // Type filter (new vs repo)
        if (buildingFilters.type !== 'all') {
            if (buildingFilters.type === 'new' && building.isRepo) return false;
            if (buildingFilters.type === 'repo' && !building.isRepo) return false;
        }

        return true;
    });

    if (filteredBuildings.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-light);">No buildings match your filters.</p>';
        return;
    }

    container.innerHTML = filteredBuildings.map(building => {
        const override = overrides[building.serialNumber] || {};
        const status = override.status || 'available';
        const isHidden = override.hidden || false;
        const lotLocation = override.lotLocation || null;

        // Check if building has images (check localStorage cache)
        let imageCount = 0;
        let hasImages = false;
        try {
            const imageOrderKey = `cpb_image_order_${building.serialNumber}`;
            const storedOrder = localStorage.getItem(imageOrderKey);
            if (storedOrder) {
                const images = JSON.parse(storedOrder);
                imageCount = images.length;
                hasImages = imageCount > 0;
            }
        } catch (e) {
            // Ignore errors
        }

        const imageIndicator = hasImages
            ? `<span style="color: #27ae60; font-weight: 600; margin-left: 0.5rem;" title="${imageCount} image(s)">📷 ${imageCount}</span>`
            : `<span style="color: #e74c3c; font-weight: 600; margin-left: 0.5rem;" title="No images">📷 0</span>`;

        return `
            <div class="building-item">
                <div class="building-info-admin">
                    <h3>
                        ${building.title} - ${building.sizeDisplay}
                        ${imageIndicator}
                        <span class="status-badge ${status}">${status.toUpperCase()}</span>
                        ${isHidden ? '<span class="status-badge hidden">HIDDEN</span>' : ''}
                        ${lotLocation ? `<span class="lot-badge" style="margin-left: 0.5rem;">📍 ${lotLocation}</span>` : ''}
                    </h3>
                    <p>SN: ${building.serialNumber} | $${building.price.toLocaleString()} ${building.isRepo ? '(Pre-Owned)' : ''}</p>
                </div>
                <div class="building-actions">
                    <button class="btn btn-sm btn-primary"
                            onclick="openImageModal('${building.serialNumber}')">📷 Images</button>
                    <button class="btn btn-sm btn-primary"
                            onclick="postBuildingToFacebook('${building.serialNumber}')"
                            style="background: #1877f2;">
                        📘 Post to Facebook
                    </button>
                    <button class="btn btn-sm ${status === 'available' ? 'btn-success' : 'btn-secondary'}"
                            onclick="setBuildingStatus('${building.serialNumber}', 'available')">Available</button>
                    <button class="btn btn-sm ${status === 'pending' ? 'btn-warning' : 'btn-secondary'}"
                            onclick="setBuildingStatus('${building.serialNumber}', 'pending')">Pending</button>
                    <button class="btn btn-sm ${status === 'sold' ? 'btn-danger' : 'btn-secondary'}"
                            onclick="setBuildingStatus('${building.serialNumber}', 'sold')">Sold</button>
                    <button class="btn btn-sm btn-secondary"
                            onclick="toggleBuildingVisibility('${building.serialNumber}')">
                        ${isHidden ? 'Show' : 'Hide'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getBuildingOverrides() {
    // Try database cache first
    if (dbCache.overrides) {
        return dbCache.overrides;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    return stored ? JSON.parse(stored) : {};
}

async function setBuildingStatus(serialNumber, status) {
    const overrides = getBuildingOverrides();

    if (!overrides[serialNumber]) {
        overrides[serialNumber] = {};
    }

    overrides[serialNumber].status = status;

    // Save to localStorage for backwards compatibility
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(overrides));

    // Update cache and save to database
    dbCache.overrides = overrides;
    await saveToDatabase('overrides', overrides);

    loadBuildings();
    showToast(`Building status updated to ${status}!`);
}

async function toggleBuildingVisibility(serialNumber) {
    const overrides = getBuildingOverrides();

    if (!overrides[serialNumber]) {
        overrides[serialNumber] = {};
    }

    overrides[serialNumber].hidden = !overrides[serialNumber].hidden;

    // Save to localStorage for backwards compatibility
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(overrides));

    // Update cache and save to database
    dbCache.overrides = overrides;
    await saveToDatabase('overrides', overrides);

    loadBuildings();
    showToast(overrides[serialNumber].hidden ? 'Building hidden!' : 'Building shown!');
}

// Toast Notifications
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Image Management
const MAX_IMAGES = 5;
let currentBuilding = null;

function openImageModal(serialNumber) {
    currentBuilding = serialNumber;
    const inventory = window.PROCESSED_INVENTORY || [];
    const building = inventory.find(b => b.serialNumber === serialNumber);

    if (!building) return;

    // Update modal header info
    document.getElementById('modal-building-info').innerHTML = `
        <h3>${building.title} - ${building.sizeDisplay}</h3>
        <p>Serial: ${building.serialNumber}</p>
    `;

    // Load existing images
    loadBuildingImages(serialNumber);

    // Show modal
    document.getElementById('image-modal').classList.add('show');

    // Setup file upload handler
    const uploadInput = document.getElementById('image-upload');
    uploadInput.value = '';
    uploadInput.onchange = handleImageUpload;
}

function closeImageModal() {
    document.getElementById('image-modal').classList.remove('show');
    currentBuilding = null;
}

async function loadBuildingImages(serialNumber) {
    const container = document.getElementById('building-images');
    container.innerHTML = '<p style="text-align: center; color: var(--text-light);">Loading images...</p>';

    try {
        const response = await fetch(`/api/images?serialNumber=${encodeURIComponent(serialNumber)}`);
        const data = await response.json();

        if (!data.success || data.images.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No images uploaded yet</p>';
            container.classList.add('empty');
            return;
        }

        // Check if there's a custom order stored (check database cache first)
        let orderedImages = null;
        if (dbCache.imageOrders && dbCache.imageOrders[serialNumber]) {
            orderedImages = dbCache.imageOrders[serialNumber];
        } else {
            // Fallback to localStorage
            const orderKey = `cpb_image_order_${serialNumber}`;
            orderedImages = JSON.parse(localStorage.getItem(orderKey) || 'null');
        }

        // If no custom order, use default (by upload time)
        if (!orderedImages) {
            orderedImages = data.images;
        } else {
            // Filter out any images that no longer exist
            orderedImages = orderedImages.filter(url => data.images.includes(url));
            // Add any new images that aren't in the order
            data.images.forEach(url => {
                if (!orderedImages.includes(url)) {
                    orderedImages.push(url);
                }
            });
        }

        container.classList.remove('empty');
        container.innerHTML = orderedImages.map((imageUrl, index) => `
            <div class="image-item" draggable="true" data-index="${index}" data-url="${imageUrl}">
                <img src="${imageUrl}" alt="Building ${index + 1}">
                <button class="image-item-remove" onclick="removeBuildingImage('${imageUrl}')">×</button>
                <button class="image-item-main-btn ${index === 0 ? 'active' : ''}"
                        onclick="setMainImage('${imageUrl}')"
                        title="${index === 0 ? 'Main Image' : 'Set as Main'}">
                    ★
                </button>
                ${index === 0 ? '<div class="image-item-primary">Main</div>' : ''}
            </div>
        `).join('');

        // Add drag and drop functionality
        addImageDragAndDrop();
    } catch (error) {
        console.error('Failed to load images:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">Failed to load images</p>';
    }
}

async function getBuildingImages(serialNumber) {
    try {
        // Include userId in request so API can load saved image order from database
        const userId = user ? user.id : null;
        const userIdParam = userId ? `&userId=${userId}` : '';

        const response = await fetch(`/api/images?serialNumber=${encodeURIComponent(serialNumber)}${userIdParam}`);
        const data = await response.json();

        if (!data.success || !data.images.length) {
            return [];
        }

        // The API already returns images in the correct order (main image first)
        // when userId is provided, so we can just return them directly
        return data.images;

        // Legacy code below kept for backwards compatibility if API fails to order
        // Check for custom order (database cache first)
        let orderedImages = null;
        if (dbCache.imageOrders && dbCache.imageOrders[serialNumber]) {
            orderedImages = dbCache.imageOrders[serialNumber];
        } else {
            // Fallback to localStorage
            const orderKey = `cpb_image_order_${serialNumber}`;
            orderedImages = JSON.parse(localStorage.getItem(orderKey) || 'null');
        }

        // If no custom order, use default
        if (!orderedImages) {
            return data.images;
        }

        // Filter and reorder
        orderedImages = orderedImages.filter(url => data.images.includes(url));
        data.images.forEach(url => {
            if (!orderedImages.includes(url)) {
                orderedImages.push(url);
            }
        });

        return orderedImages;
    } catch (error) {
        console.error('Failed to get images:', error);
        return [];
    }
}

async function handleImageUpload(event) {
    const files = Array.from(event.target.files);

    if (!files || files.length === 0) {
        showToast('No files selected', true);
        return;
    }

    console.log('Files selected:', files.length);

    const currentImages = await getBuildingImages(currentBuilding);

    if (currentImages.length + files.length > MAX_IMAGES) {
        showToast(`Maximum ${MAX_IMAGES} images allowed per building`, true);
        return;
    }

    showToast('Uploading images...');

    let uploadedCount = 0;

    try {
        for (const file of files) {
            console.log('Processing file:', file.name, file.type, file.size);
            let processedFile = file;

            // Convert HEIC to JPEG
            if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                showToast('Converting HEIC image...');
                try {
                    const convertedBlob = await heic2any({
                        blob: file,
                        toType: 'image/jpeg',
                        quality: 0.6
                    });
                    processedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                        type: 'image/jpeg'
                    });
                    console.log('HEIC converted successfully');
                } catch (error) {
                    console.error('HEIC conversion failed:', error);
                    showToast('HEIC conversion failed: ' + error.message, true);
                    continue;
                }
            }

            // Compress and resize image
            const compressedImage = await compressImage(processedFile);
            console.log('Image compressed, original:', file.size, 'compressed:', compressedImage.length);

            // Upload to Vercel Blob
            try {
                showToast(`Uploading ${file.name}...`);
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        serialNumber: currentBuilding,
                        imageData: compressedImage,
                        filename: processedFile.name
                    })
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Upload failed');
                }

                console.log('Uploaded successfully:', result.url);
                uploadedCount++;
            } catch (error) {
                console.error('Upload error:', error);
                showToast(`Failed to upload ${file.name}: ${error.message}`, true);
            }
        }

        if (uploadedCount > 0) {
            await loadBuildingImages(currentBuilding);
            showToast(`${uploadedCount} image(s) uploaded successfully!`);
        } else {
            showToast('No images were uploaded', true);
        }

    } catch (error) {
        console.error('Upload error:', error);
        showToast('Failed to upload images: ' + error.message, true);
    }
}

// Compress image to reduce storage size
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize to max 800px on longest side
                const maxSize = 800;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with 0.7 quality
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function removeBuildingImage(imageUrl) {
    if (!confirm('Remove this image?')) return;

    try {
        showToast('Deleting image...');
        const response = await fetch('/api/images', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Delete failed');
        }

        await loadBuildingImages(currentBuilding);
        showToast('Image removed!');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete image: ' + error.message, true);
    }
}

async function setMainImage(imageUrl) {
    try {
        showToast('Setting as main image...');

        // Get current images
        const response = await fetch(`/api/images?serialNumber=${encodeURIComponent(currentBuilding)}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to get current images');
        }

        // Reorder: move selected image to front
        const images = data.images.filter(url => url !== imageUrl);
        images.unshift(imageUrl);

        // Save to localStorage for backwards compatibility
        localStorage.setItem('cpb_image_order', JSON.stringify({ ...JSON.parse(localStorage.getItem('cpb_image_order') || '{}'), [currentBuilding]: images }));
        localStorage.setItem(`cpb_image_order_${currentBuilding}`, JSON.stringify(images));

        // Update cache and save to database
        if (!dbCache.imageOrders) dbCache.imageOrders = {};
        dbCache.imageOrders[currentBuilding] = images;
        await saveToDatabase('imageOrders', dbCache.imageOrders);

        await loadBuildingImages(currentBuilding);
        showToast('Main image updated!');
    } catch (error) {
        console.error('Set main error:', error);
        showToast('Failed to set main image: ' + error.message, true);
    }
}

function addImageDragAndDrop() {
    const items = document.querySelectorAll('.image-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedItem !== item) {
                const draggedUrl = draggedItem.dataset.url;
                const targetIndex = parseInt(item.dataset.index);

                try {
                    // Get current images
                    const response = await fetch(`/api/images?serialNumber=${encodeURIComponent(currentBuilding)}`);
                    const data = await response.json();

                    if (!data.success) {
                        throw new Error('Failed to get current images');
                    }

                    // Get current order or use default
                    let images = (dbCache.imageOrders && dbCache.imageOrders[currentBuilding]) || data.images;

                    // Remove dragged image and insert at target position
                    const draggedIndex = images.indexOf(draggedUrl);
                    images.splice(draggedIndex, 1);
                    images.splice(targetIndex, 0, draggedUrl);

                    // Save to localStorage for backwards compatibility
                    let allOrders = JSON.parse(localStorage.getItem('cpb_image_order') || '{}');
                    allOrders[currentBuilding] = images;
                    localStorage.setItem('cpb_image_order', JSON.stringify(allOrders));
                    localStorage.setItem(`cpb_image_order_${currentBuilding}`, JSON.stringify(images));

                    // Update cache and save to database
                    if (!dbCache.imageOrders) dbCache.imageOrders = {};
                    dbCache.imageOrders[currentBuilding] = images;
                    await saveToDatabase('imageOrders', dbCache.imageOrders);

                    await loadBuildingImages(currentBuilding);
                    showToast('Image order updated!');
                } catch (error) {
                    console.error('Reorder error:', error);
                    showToast('Failed to reorder images', true);
                }
            }
        });
    });
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('image-modal');
    if (e.target === modal) {
        closeImageModal();
    }
});

// Lot Management Functions
async function loadLots() {
    const container = document.getElementById('lots-list');

    try {
        // Fetch latest lot data from server
        const response = await fetch('/api/get-lot-config');
        const data = await response.json();

        const lots = data.success && data.lots ? data.lots : [];

        // Also update localStorage with latest data
        localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));

        if (!lots || lots.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--text-light);">No other lots added yet. Add one below to start syncing inventory.</p>';
            return;
        }

        // Count buildings for each lot from the actual inventory
        const inventory = window.PROCESSED_INVENTORY || [];
        const lotCounts = {};
        inventory.forEach(building => {
            const location = building.location;
            if (location) {
                lotCounts[location] = (lotCounts[location] || 0) + 1;
            }
        });

        container.innerHTML = lots.map((lot, index) => {
            const syncStatus = lot.lastSync ?
                `Last synced: ${new Date(lot.lastSync).toLocaleString()}` :
                'Will sync automatically during next scheduled sync';

            // Get actual building count from inventory
            const buildingCount = lotCounts[lot.name] || 0;

            return `
                <div class="lot-item">
                    <div class="lot-info">
                        <h3>
                            ${lot.name}
                            <span class="lot-badge">${buildingCount} buildings</span>
                        </h3>
                        <p class="sync-status">${syncStatus}</p>
                    </div>
                    <div class="lot-actions">
                        <button class="btn btn-sm btn-danger" onclick="removeLot(${index})">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load lots:', error);
        container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--text-light);">Failed to load lots</p>';
    }
}

function getLots() {
    const stored = localStorage.getItem(STORAGE_KEYS.LOTS);
    return stored ? JSON.parse(stored) : [];
}

async function addLot() {
    const name = document.getElementById('lot-name').value.trim();
    const username = document.getElementById('lot-username').value.trim();
    const password = document.getElementById('lot-password').value.trim();

    if (!name || !username || !password) {
        showToast('Please fill in all fields', true);
        return;
    }

    const lots = getLots();

    // Check for duplicate
    if (lots.some(lot => lot.name === name)) {
        showToast('This lot name is already added', true);
        return;
    }

    lots.push({
        name,
        username,
        password,
        lastSync: null,
        buildingCount: 0
    });

    // Save to localStorage for UI
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));

    // Save to server for automated sync
    showToast('Saving lot configuration...');
    try {
        const response = await fetch('/api/save-lot-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lots })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to save');
        }

        // Clear form
        document.getElementById('lot-name').value = '';
        document.getElementById('lot-username').value = '';
        document.getElementById('lot-password').value = '';

        loadLots();
        showToast('Lot added! It will be synced automatically during daily sync.');
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save lot configuration: ' + error.message, true);
    }
}

async function removeLot(index) {
    if (!confirm('Remove this lot and all its synced buildings?')) return;

    const lots = getLots();
    const removed = lots.splice(index, 1)[0];

    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));

    // Save to server for automated sync
    try {
        const response = await fetch('/api/save-lot-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lots })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to save');
        }
    } catch (error) {
        console.error('Failed to update server config:', error);
    }

    // Remove buildings from this lot
    const overrides = getBuildingOverrides();
    for (const serialNumber in overrides) {
        if (overrides[serialNumber].lotLocation === removed.name) {
            delete overrides[serialNumber];
        }
    }
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(overrides));

    loadLots();
    loadBuildings();
    showToast('Lot removed!');
}

// Check if sync server is running
async function checkSyncServer() {
    const statusEl = document.getElementById('sync-server-status');
    if (!statusEl) return;

    try {
        const response = await fetch(`${SYNC_SERVER_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
            statusEl.innerHTML = '✅ <strong>Sync server is running</strong> - You can sync lots from the admin panel';
            statusEl.style.color = 'var(--success-color)';
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        statusEl.innerHTML = '⚠️ <strong>Sync server not running</strong><br>Run <code>npm run sync:server</code> in your project folder to enable lot syncing';
        statusEl.style.color = 'var(--warning-color)';
    }
}

// Sync lot via local server
async function syncLot(index) {
    const lots = getLots();
    const lot = lots[index];

    if (!lot.username || !lot.password) {
        showToast('Lot credentials missing', true);
        return;
    }

    showToast(`Syncing ${lot.name}... This may take 1-2 minutes.`);

    try {
        const response = await fetch(`${SYNC_SERVER_URL}/sync-lot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: lot.username,
                password: lot.password,
                lotName: lot.name
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Sync failed');
        }

        const rawInventory = result.inventory;

        if (!rawInventory || rawInventory.length === 0) {
            throw new Error('No buildings found');
        }

        // Process each building through the decoder
        const decoded = rawInventory.map(item => {
            const decoder = new SerialNumberDecoder(item.serialNumber);
            const details = decoder.getFullDetails();

            if (!details.valid) {
                console.warn('Invalid serial number:', item.serialNumber);
                return null;
            }

            return {
                ...item,
                ...details,
                typeCode: details.type.code,
                typeName: details.type.name,
                sizeDisplay: details.size.display,
                width: details.size.width,
                length: details.size.length,
                dateBuilt: details.dateBuilt.display,
                isRepo: item.isRepo || details.status === 'repo'
            };
        }).filter(item => item !== null);

        // Tag buildings with lot location
        const overrides = getBuildingOverrides();
        decoded.forEach(building => {
            if (!overrides[building.serialNumber]) {
                overrides[building.serialNumber] = {};
            }
            overrides[building.serialNumber].lotLocation = lot.name;
        });
        localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(overrides));

        // Update lot sync info
        lot.lastSync = new Date().toISOString();
        lot.buildingCount = decoded.length;
        lots[index] = lot;
        localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));

        loadLots();
        loadBuildings();
        showToast(`Successfully synced ${decoded.length} buildings from ${lot.name}!`);
    } catch (error) {
        console.error('Sync error:', error);
        if (error.message.includes('fetch')) {
            showToast('Sync server not running. Start it with: npm run sync:server', true);
        } else {
            showToast(`Failed to sync ${lot.name}: ${error.message}`, true);
        }
    }
}

// Manual Sync Function
async function triggerManualSync() {
    const btn = document.getElementById('manual-sync-btn');
    const status = document.getElementById('sync-status');

    // Disable button
    btn.disabled = true;
    btn.textContent = '⏳ Syncing...';
    status.textContent = 'Triggering sync on your server...';
    status.style.color = 'var(--text-light)';

    try {
        const response = await fetch('/api/trigger-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            status.textContent = '✅ Sync started! Check back in 2-3 minutes to see updated inventory.';
            status.style.color = 'var(--success-color)';
            showToast('Manual sync triggered successfully!');
        } else {
            status.textContent = result.message || 'Sync will run automatically at 2 AM daily.';
            status.style.color = 'var(--warning-color)';
            showToast(result.message || 'Could not trigger manual sync', true);
        }
    } catch (error) {
        console.error('Sync trigger error:', error);
        status.textContent = 'Could not connect to sync server. Automatic sync runs daily at 2 AM.';
        status.style.color = 'var(--warning-color)';
        showToast('Could not trigger manual sync. Automatic sync runs daily at 2 AM.', true);
    } finally {
        // Re-enable button after 10 seconds
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = '🔄 Run Manual Sync Now';
        }, 10000);
    }
}

// GPB Credentials Management
async function loadGpbCredentials() {
    try {
        const response = await fetch('/api/user/get-gpb-credentials', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        const result = await response.json();

        if (result.success && result.hasCredentials) {
            const usernameInput = document.getElementById('gpbUsername');
            const passwordInput = document.getElementById('gpbPassword');
            const autoSyncInput = document.getElementById('autoSyncEnabled');

            if (usernameInput) usernameInput.value = result.username || '';
            // Don't show password in UI for security
            if (passwordInput) passwordInput.placeholder = 'Password saved (leave blank to keep current)';
            if (autoSyncInput) autoSyncInput.checked = result.autoSync || false;
        }
    } catch (error) {
        console.error('Load GPB credentials error:', error);
    }
}

async function saveGpbCredentials() {
    const username = document.getElementById('gpbUsername')?.value.trim();
    const password = document.getElementById('gpbPassword')?.value;
    const autoSync = document.getElementById('autoSyncEnabled')?.checked;
    const statusEl = document.getElementById('gpb-status');

    if (!username) {
        if (statusEl) {
            statusEl.textContent = '❌ Please enter your GPB Sales username/email';
            statusEl.style.color = 'var(--error-color)';
        }
        return;
    }

    // Only require password if it's not already saved
    const placeholder = document.getElementById('gpbPassword')?.placeholder || '';
    if (!password && !placeholder.includes('Password saved')) {
        if (statusEl) {
            statusEl.textContent = '❌ Please enter your GPB Sales password';
            statusEl.style.color = 'var(--error-color)';
        }
        return;
    }

    if (statusEl) {
        statusEl.textContent = '⏳ Saving credentials...';
        statusEl.style.color = 'var(--text-light)';
    }

    try {
        const body = {
            username,
            autoSync: autoSync || false
        };

        // Only send password if it was entered
        if (password) {
            body.password = password;
        }

        const response = await fetch('/api/user/save-gpb-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (result.success) {
            if (statusEl) {
                statusEl.textContent = '✅ Credentials saved successfully!';
                statusEl.style.color = 'var(--success-color)';
            }
            showToast('GPB credentials saved successfully!');

            // Update placeholder if password was set
            if (password) {
                const passwordInput = document.getElementById('gpbPassword');
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.placeholder = 'Password saved (leave blank to keep current)';
                }
            }
        } else {
            if (statusEl) {
                statusEl.textContent = '❌ ' + (result.error || 'Failed to save credentials');
                statusEl.style.color = 'var(--error-color)';
            }
            showToast(result.error || 'Failed to save credentials', true);
        }
    } catch (error) {
        console.error('Save GPB credentials error:', error);
        if (statusEl) {
            statusEl.textContent = '❌ Failed to save credentials';
            statusEl.style.color = 'var(--error-color)';
        }
        showToast('Failed to save credentials', true);
    }
}

async function triggerUserSync() {
    const btn = document.getElementById('user-sync-btn');
    const status = document.getElementById('gpb-status');

    if (btn) btn.disabled = true;
    if (btn) btn.textContent = '⏳ Syncing...';
    if (status) {
        status.textContent = 'Starting inventory sync...';
        status.style.color = 'var(--text-light)';
    }

    try {
        const response = await fetch('/api/user/trigger-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            if (status) {
                status.textContent = `✅ Success! Synced ${result.count} buildings. Reloading page...`;
                status.style.color = 'var(--success-color)';
            }
            showToast(`Successfully synced ${result.count} buildings!`);

            // Reload page after sync
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            if (status) {
                status.textContent = '❌ ' + (result.message || result.error || 'Sync failed');
                status.style.color = 'var(--error-color)';
            }
            showToast(result.message || result.error || 'Sync failed', true);
        }
    } catch (error) {
        console.error('Sync trigger error:', error);
        if (status) {
            status.textContent = '❌ Could not connect to sync server. Make sure sync server is running.';
            status.style.color = 'var(--error-color)';
        }
        showToast('Could not connect to sync server', true);
    } finally {
        // Re-enable button after 10 seconds
        setTimeout(() => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 Sync Now';
            }
        }, 10000);
    }
}

// Color Scheme Management
function loadColorScheme() {
    const saved = getSetting(STORAGE_KEYS.COLOR_SCHEME, 'rustic-earth');
    const scheme = saved || 'rustic-earth';

    const radio = document.querySelector(`input[name="colorScheme"][value="${scheme}"]`);
    if (radio) {
        radio.checked = true;
    }
}

// Business Information Management
function loadBusinessInfo() {
    // Load from user profile first, fallback to settings for backwards compat
    const user = window.currentUser;

    // Load business name - prefer user profile
    const businessName = user?.businessName || getSetting(STORAGE_KEYS.BUSINESS_NAME, '');
    const nameInput = document.getElementById('businessName');
    if (nameInput) {
        nameInput.value = businessName;
    }

    // Load phone - prefer user profile
    const businessPhone = user?.phone || getSetting(STORAGE_KEYS.BUSINESS_PHONE, '');
    const phoneInput = document.getElementById('businessPhone');
    if (phoneInput) {
        phoneInput.value = businessPhone;
    }

    // Load email - prefer user profile best_contact_email
    const businessEmail = user?.best_contact_email || user?.email || getSetting(STORAGE_KEYS.BUSINESS_EMAIL, '');
    const emailInput = document.getElementById('businessEmail');
    if (emailInput) {
        emailInput.value = businessEmail;
    }

    // Load address - prefer user profile
    const businessAddress = user?.address || getSetting(STORAGE_KEYS.BUSINESS_ADDRESS, '');
    const addressInput = document.getElementById('businessAddress');
    if (addressInput) {
        addressInput.value = businessAddress;
    }
}

function getBusinessName() {
    return getSetting(STORAGE_KEYS.BUSINESS_NAME, 'Community Portable Buildings');
}

function getBusinessPhone() {
    return getSetting(STORAGE_KEYS.BUSINESS_PHONE, '318-594-5909');
}

function getBusinessEmail() {
    return getSetting(STORAGE_KEYS.BUSINESS_EMAIL, '');
}

function getBusinessAddress() {
    return getSetting(STORAGE_KEYS.BUSINESS_ADDRESS, '');
}

// Social Media Management
function loadSocialMedia() {
    const social = getSetting(STORAGE_KEYS.SOCIAL_MEDIA, {});

    const facebookInput = document.getElementById('facebookUrl');
    const instagramInput = document.getElementById('instagramUrl');
    const twitterInput = document.getElementById('twitterUrl');

    if (facebookInput) facebookInput.value = social.facebook || '';
    if (instagramInput) instagramInput.value = social.instagram || '';
    if (twitterInput) twitterInput.value = social.twitter || '';
}

function getSocialMedia() {
    return getSetting(STORAGE_KEYS.SOCIAL_MEDIA, {});
}

// Facebook Auto-Post Configuration
function loadFacebookConfig() {
    const config = getSetting(STORAGE_KEYS.FACEBOOK_CONFIG, {
        enabled: false,
        pageId: '',
        accessToken: '',
        newOnly: true,
        withImages: true,
        availableOnly: true,
        template: `🏠 New Arrival! {{name}}

📐 Size: {{size}}
💰 Cash Price: {{price}}
📍 Location: {{location}}

Call us at {{phone}} or visit our website to learn more!

#PortableBuildings #{{type}} #ForSale`
    });

    const enabledInput = document.getElementById('enableAutoPost');
    const pageIdInput = document.getElementById('facebookPageId');
    const tokenInput = document.getElementById('facebookAccessToken');
    const newOnlyInput = document.getElementById('autoPostNewOnly');
    const withImagesInput = document.getElementById('autoPostWithImages');
    const availableOnlyInput = document.getElementById('autoPostAvailableOnly');
    const templateInput = document.getElementById('autoPostTemplate');

    if (enabledInput) enabledInput.checked = config.enabled;
    if (pageIdInput) pageIdInput.value = config.pageId;
    if (tokenInput) tokenInput.value = config.accessToken;
    if (newOnlyInput) newOnlyInput.checked = config.newOnly;
    if (withImagesInput) withImagesInput.checked = config.withImages;
    if (availableOnlyInput) availableOnlyInput.checked = config.availableOnly;
    if (templateInput) templateInput.value = config.template;
}

function getFacebookConfig() {
    return getSetting(STORAGE_KEYS.FACEBOOK_CONFIG, null);
}

// Save just the Facebook template (used for auto-save when pasting templates)
async function saveFacebookTemplate(template) {
    try {
        // Get current Facebook config
        const currentConfig = getFacebookConfig() || {
            enabled: false,
            pageId: '',
            accessToken: '',
            newOnly: true,
            withImages: true,
            availableOnly: true,
            template: ''
        };

        // Update only the template
        currentConfig.template = template;

        // Save back to storage
        await saveSetting(STORAGE_KEYS.FACEBOOK_CONFIG, currentConfig);

        showToast('✅ Template auto-saved successfully!');
    } catch (error) {
        console.error('Error auto-saving template:', error);
        showToast('⚠️ Template loaded but failed to auto-save. Please save manually.', true);
    }
}

// Button Color Management
function loadButtonColor() {
    const saved = getSetting(STORAGE_KEYS.BUTTON_COLOR, null);

    if (saved) {
        const colorPicker = document.getElementById('buttonColor');
        const hexInput = document.getElementById('buttonColorHex');

        if (colorPicker) colorPicker.value = saved;
        if (hexInput) hexInput.value = saved;
    }
}

function getButtonColor() {
    return getSetting(STORAGE_KEYS.BUTTON_COLOR, null);
}

function resetButtonColor() {
    // Remove custom button color
    localStorage.removeItem(STORAGE_KEYS.BUTTON_COLOR);

    // Reset to scheme default
    const selectedScheme = document.querySelector('input[name="colorScheme"]:checked');
    const schemeDefaults = {
        'rustic-earth': '#2C5F2D',
        'modern-ranch': '#7C2529',
        'desert-timber': '#C19A6B'
    };

    const defaultColor = schemeDefaults[selectedScheme?.value] || '#2C5F2D';

    const colorPicker = document.getElementById('buttonColor');
    const hexInput = document.getElementById('buttonColorHex');

    if (colorPicker) colorPicker.value = defaultColor;
    if (hexInput) hexInput.value = defaultColor;

    showToast('Button color reset to scheme default');
}

function initializeColorInputSync() {
    const colorPicker = document.getElementById('buttonColor');
    const hexInput = document.getElementById('buttonColorHex');

    if (colorPicker && hexInput) {
        // Sync color picker -> hex input
        colorPicker.addEventListener('input', (e) => {
            hexInput.value = e.target.value;
        });

        // Sync hex input -> color picker
        hexInput.addEventListener('input', (e) => {
            let value = e.target.value.trim();

            // Add # if missing
            if (value && !value.startsWith('#')) {
                value = '#' + value;
            }

            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                colorPicker.value = value;
                hexInput.style.borderColor = 'var(--border)';
            } else if (value.length > 0) {
                hexInput.style.borderColor = 'var(--danger-color)';
            }
        });
    }
}

async function saveCustomization() {
    // Save business profile to users table (so it shows on the live site)
    const businessName = document.getElementById('businessName')?.value.trim() || '';
    const businessPhone = document.getElementById('businessPhone')?.value.trim() || '';
    const businessEmail = document.getElementById('businessEmail')?.value.trim() || '';
    const businessAddress = document.getElementById('businessAddress')?.value.trim() || '';

    try {
        const token = localStorage.getItem('auth_token');
        const profileResponse = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                businessName,
                phone: businessPhone,
                email: businessEmail,
                address: businessAddress
            })
        });

        const profileResult = await profileResponse.json();
        if (!profileResult.success) {
            console.error('Failed to update profile:', profileResult.error);
            showToast('Warning: Profile update failed - ' + profileResult.error, true);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Warning: Profile update failed', true);
    }

    // Also save to settings for backward compatibility
    await saveSetting(STORAGE_KEYS.BUSINESS_NAME, businessName);
    await saveSetting(STORAGE_KEYS.BUSINESS_PHONE, businessPhone);
    await saveSetting(STORAGE_KEYS.BUSINESS_EMAIL, businessEmail);
    await saveSetting(STORAGE_KEYS.BUSINESS_ADDRESS, businessAddress);

    // Save social media
    const social = {
        facebook: document.getElementById('facebookUrl')?.value.trim() || '',
        instagram: document.getElementById('instagramUrl')?.value.trim() || '',
        twitter: document.getElementById('twitterUrl')?.value.trim() || ''
    };
    await saveSetting(STORAGE_KEYS.SOCIAL_MEDIA, social);

    // Save Facebook auto-post configuration
    const fbConfig = {
        enabled: document.getElementById('enableAutoPost')?.checked || false,
        pageId: document.getElementById('facebookPageId')?.value.trim() || '',
        accessToken: document.getElementById('facebookAccessToken')?.value.trim() || '',
        newOnly: document.getElementById('autoPostNewOnly')?.checked ?? true,
        withImages: document.getElementById('autoPostWithImages')?.checked ?? true,
        availableOnly: document.getElementById('autoPostAvailableOnly')?.checked ?? true,
        template: document.getElementById('autoPostTemplate')?.value || ''
    };
    await saveSetting(STORAGE_KEYS.FACEBOOK_CONFIG, fbConfig);

    // Save color scheme
    const selectedScheme = document.querySelector('input[name="colorScheme"]:checked');
    if (selectedScheme) {
        await saveSetting(STORAGE_KEYS.COLOR_SCHEME, selectedScheme.value);
    }

    // Save button color
    const buttonColor = document.getElementById('buttonColor');
    if (buttonColor) {
        await saveSetting(STORAGE_KEYS.BUTTON_COLOR, buttonColor.value);
    }

    // Save welcome message
    await saveWelcomeMessage();

    // Save carousel (no async needed - just shows toast)
    saveCarousel();

    // Save background settings (no async needed)
    saveBackgroundSettings();

    // Save location hours
    await saveLocationHours();

    showToast('Site customization saved successfully!');
}

// Facebook Auto-Posting
async function checkAndPostToFacebook(building) {
    const config = getFacebookConfig();

    if (!config || !config.enabled) {
        return; // Auto-posting disabled
    }

    // Get list of already posted buildings
    const postedBuildings = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTED_BUILDINGS) || '[]');

    // Check if already posted
    if (postedBuildings.includes(building.serialNumber)) {
        return; // Already posted
    }

    // REQUIRED: Check for images (always required for auto-posting)
    const images = await getBuildingImages(building.serialNumber);
    if (!images || images.length === 0) {
        console.log('Skipping Facebook post: No images uploaded');
        return; // ALWAYS skip if no images
    }
    building.images = images; // Add images to building object

    // REQUIRED: Check for valid pricing
    if (!building.price || building.price <= 0) {
        console.log('Skipping Facebook post: No valid pricing');
        return; // ALWAYS skip if no price
    }

    // REQUIRED: Check for complete description (from decoder)
    if (!building.typeName || !building.sizeDisplay || !building.serialNumber) {
        console.log('Skipping Facebook post: Incomplete building description');
        return; // ALWAYS skip if description is incomplete
    }

    // Check optional conditions
    const override = getBuildingOverrides()[building.serialNumber] || {};
    const status = override.status || 'available';

    // Optional: Check if building meets user-configured criteria
    if (config.newOnly && building.isRepo) {
        console.log('Skipping Facebook post: Repo building (newOnly enabled)');
        return; // Skip repos if newOnly is enabled
    }

    if (config.availableOnly && status !== 'available') {
        console.log('Skipping Facebook post: Not available status');
        return; // Skip if not available
    }

    // Get business phone for template
    const businessPhone = getBusinessPhone();

    try {
        // Call Facebook API
        const response = await fetch('/api/post-to-facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                building,
                config,
                businessPhone
            })
        });

        const result = await response.json();

        if (result.success) {
            // Mark as posted
            postedBuildings.push(building.serialNumber);
            localStorage.setItem(STORAGE_KEYS.POSTED_BUILDINGS, JSON.stringify(postedBuildings));

            showToast(`✅ Posted ${building.title} to Facebook!`);
            console.log('Facebook post successful:', result);
        } else {
            console.error('Facebook post failed:', result.error);
            showToast(`❌ Failed to post to Facebook: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Facebook post error:', error);
        showToast(`❌ Error posting to Facebook: ${error.message}`, true);
    }
}

// Test Facebook Posting
async function testFacebookPost() {
    const btn = document.getElementById('test-fb-btn-2');
    const status = document.getElementById('test-fb-status-2');

    if (!btn || !status) {
        console.error('Test Facebook button or status element not found');
        showToast('Error: UI elements not found', true);
        return;
    }

    // First, save the current template value before testing
    const templateTextarea = document.getElementById('autoPostTemplate');
    if (templateTextarea && templateTextarea.value) {
        await saveFacebookTemplate(templateTextarea.value);
    }

    const config = getFacebookConfig();

    if (!config || !config.pageId || !config.accessToken) {
        status.textContent = '❌ Please configure your Facebook Page ID and Access Token first!';
        status.style.color = 'var(--danger-color)';
        return;
    }

    // Get a sample building from inventory
    const inventory = window.PROCESSED_INVENTORY || [];
    if (inventory.length === 0) {
        status.textContent = '❌ No buildings found in inventory to test with!';
        status.style.color = 'var(--danger-color)';
        return;
    }

    // Find a building with images if possible
    let testBuilding = null;
    for (const building of inventory) {
        const images = await getBuildingImages(building.serialNumber);
        if (images && images.length > 0) {
            testBuilding = { ...building, images };
            break;
        }
    }

    // If no building with images, just use first building
    if (!testBuilding) {
        testBuilding = inventory[0];
    }

    btn.disabled = true;
    btn.textContent = '⏳ Posting to Facebook...';
    status.textContent = 'Sending test post...';
    status.style.color = 'var(--text-light)';

    const businessPhone = getBusinessPhone();

    try {
        const response = await fetch('/api/post-to-facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                building: testBuilding,
                config,
                businessPhone
            })
        });

        const result = await response.json();

        if (result.success) {
            status.textContent = `✅ Test post successful! Posted "${testBuilding.title}" to your Facebook page.`;
            status.style.color = 'var(--success-color)';
            showToast('✅ Test post sent to Facebook!');
        } else if (result.requiresUpgrade) {
            status.innerHTML = `⚠️ ${result.message} <button onclick="upgradeToPremium()" class="btn btn-warning btn-sm" style="margin-left: 0.5rem;">Upgrade Now</button>`;
            status.style.color = 'var(--warning-color)';
            showToast('⚠️ Facebook posting requires premium subscription', true);
        } else {
            status.textContent = `❌ Failed: ${result.error || 'Unknown error'}`;
            status.style.color = 'var(--danger-color)';
            showToast(`❌ Test post failed: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Test post error:', error);
        status.textContent = `❌ Error: ${error.message}`;
        status.style.color = 'var(--danger-color)';
        showToast(`❌ Test post error: ${error.message}`, true);
    } finally {
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = '📤 Send Test Post to Facebook';
        }, 3000);
    }
}

/**
 * Post a specific building to Facebook manually
 */
async function postBuildingToFacebook(serialNumber) {
    const config = getFacebookConfig();

    if (!config || !config.pageId || !config.accessToken) {
        showToast('❌ Please configure your Facebook Page connection first!', true);
        return;
    }

    // Find the building in inventory
    const inventory = window.PROCESSED_INVENTORY || [];
    const building = inventory.find(b => b.serialNumber === serialNumber);

    if (!building) {
        showToast('❌ Building not found!', true);
        return;
    }

    // Get building images
    const images = await getBuildingImages(serialNumber);
    if (!images || images.length === 0) {
        const shouldPost = confirm(
            `This building has no images uploaded yet.\n\n` +
            `Facebook posts perform much better with images. Are you sure you want to post without images?`
        );
        if (!shouldPost) {
            return;
        }
    }

    const buildingWithImages = { ...building, images: images || [] };

    // Show confirmation dialog with preview
    const imageText = images && images.length > 0
        ? `\n📷 ${images.length} image(s) will be included`
        : '\n⚠️ No images will be included';

    const shouldPost = confirm(
        `Post this building to Facebook?\n\n` +
        `🏠 ${building.title}\n` +
        `📏 Size: ${building.sizeDisplay}\n` +
        `💰 Price: $${building.price.toLocaleString()}\n` +
        `📍 Location: ${building.location || 'Main Lot'}` +
        imageText +
        `\n\nThis will post immediately to your Facebook page.`
    );

    if (!shouldPost) {
        return;
    }

    const businessPhone = getBusinessPhone();

    // Show loading toast
    showToast('⏳ Posting to Facebook...', false);

    try {
        const response = await fetch('/api/post-to-facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                building: buildingWithImages,
                config,
                businessPhone
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ Successfully posted "${building.title}" to Facebook!`);

            // Mark building as posted to prevent duplicate auto-posts
            const postedBuildings = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTED_BUILDINGS) || '{}');
            postedBuildings[serialNumber] = Date.now();
            localStorage.setItem(STORAGE_KEYS.POSTED_BUILDINGS, JSON.stringify(postedBuildings));
        } else if (result.requiresUpgrade) {
            showToast(`⚠️ ${result.message}`, true);
            if (confirm(`${result.message}\n\nWould you like to upgrade now?`)) {
                upgradeToPremium();
            }
        } else {
            showToast(`❌ Failed to post: ${result.error || 'Unknown error'}`, true);
        }
    } catch (error) {
        console.error('Manual post error:', error);
        showToast(`❌ Error posting to Facebook: ${error.message}`, true);
    }
}

// Trigger auto-post when images are uploaded
const originalHandleImageUpload = handleImageUpload;
async function handleImageUploadWithAutoPost(event) {
    await originalHandleImageUpload.call(this, event);

    // After successful upload, check if we should post
    if (currentBuilding) {
        const inventory = window.PROCESSED_INVENTORY || [];
        const building = inventory.find(b => b.serialNumber === currentBuilding);

        if (building) {
            await checkAndPostToFacebook(building);
        }
    }
}

// Background Color Picker Management
function initializeBackgroundColorPicker() {
    const typeRadios = document.querySelectorAll('input[name="backgroundType"]');
    const solidOptions = document.getElementById('solid-background-options');
    const gradientOptions = document.getElementById('gradient-background-options');
    const preview = document.getElementById('background-preview');

    // Toggle between solid/gradient options
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'solid') {
                solidOptions.style.display = 'block';
                gradientOptions.style.display = 'none';
            } else {
                solidOptions.style.display = 'none';
                gradientOptions.style.display = 'block';
            }
            updateBackgroundPreview();
        });
    });

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            document.getElementById('customBgColor').value = color;
            document.getElementById('customBgColorHex').value = color;

            // Mark as active
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');

            updateBackgroundPreview();
        });
    });

    // Gradient swatches
    document.querySelectorAll('.gradient-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const gradient = swatch.dataset.gradient;

            // Extract colors from gradient string
            const match = gradient.match(/#[0-9A-Fa-f]{6}/g);
            if (match && match.length >= 2) {
                document.getElementById('gradientColor1').value = match[0];
                document.getElementById('gradientColor1Hex').value = match[0];
                document.getElementById('gradientColor2').value = match[1];
                document.getElementById('gradientColor2Hex').value = match[1];
            }

            // Mark as active
            document.querySelectorAll('.gradient-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');

            updateBackgroundPreview();
        });
    });

    // Custom color inputs
    const bgColorPicker = document.getElementById('customBgColor');
    const bgColorHex = document.getElementById('customBgColorHex');
    const grad1Picker = document.getElementById('gradientColor1');
    const grad1Hex = document.getElementById('gradientColor1Hex');
    const grad2Picker = document.getElementById('gradientColor2');
    const grad2Hex = document.getElementById('gradientColor2Hex');

    if (bgColorPicker && bgColorHex) {
        bgColorPicker.addEventListener('input', (e) => {
            bgColorHex.value = e.target.value;
            updateBackgroundPreview();
        });
        bgColorHex.addEventListener('input', (e) => {
            let value = e.target.value.trim();
            if (value && !value.startsWith('#')) value = '#' + value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                bgColorPicker.value = value;
                updateBackgroundPreview();
            }
        });
    }

    if (grad1Picker && grad1Hex) {
        grad1Picker.addEventListener('input', (e) => {
            grad1Hex.value = e.target.value;
            updateBackgroundPreview();
        });
        grad1Hex.addEventListener('input', (e) => {
            let value = e.target.value.trim();
            if (value && !value.startsWith('#')) value = '#' + value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                grad1Picker.value = value;
                updateBackgroundPreview();
            }
        });
    }

    if (grad2Picker && grad2Hex) {
        grad2Picker.addEventListener('input', (e) => {
            grad2Hex.value = e.target.value;
            updateBackgroundPreview();
        });
        grad2Hex.addEventListener('input', (e) => {
            let value = e.target.value.trim();
            if (value && !value.startsWith('#')) value = '#' + value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                grad2Picker.value = value;
                updateBackgroundPreview();
            }
        });
    }

    // Load saved background settings
    loadBackgroundSettings();
}

function updateBackgroundPreview() {
    const preview = document.getElementById('background-preview');
    if (!preview) return; // Element doesn't exist, skip preview update

    const selectedType = document.querySelector('input[name="backgroundType"]:checked')?.value || 'solid';

    if (selectedType === 'solid') {
        const color = document.getElementById('customBgColor')?.value || '#ffffff';
        preview.style.background = color;
    } else {
        const color1 = document.getElementById('gradientColor1')?.value || '#667eea';
        const color2 = document.getElementById('gradientColor2')?.value || '#764ba2';
        preview.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
    }
}

function loadBackgroundSettings() {
    const saved = localStorage.getItem('cpb_background_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);

            // Set type radio
            const typeRadio = document.querySelector(`input[name="backgroundType"][value="${settings.type}"]`);
            if (typeRadio) {
                typeRadio.checked = true;
                typeRadio.dispatchEvent(new Event('change'));
            }

            if (settings.type === 'solid') {
                const bgColor = document.getElementById('customBgColor');
                const bgColorHex = document.getElementById('customBgColorHex');
                if (bgColor) bgColor.value = settings.color;
                if (bgColorHex) bgColorHex.value = settings.color;
            } else {
                const grad1 = document.getElementById('gradientColor1');
                const grad1Hex = document.getElementById('gradientColor1Hex');
                const grad2 = document.getElementById('gradientColor2');
                const grad2Hex = document.getElementById('gradientColor2Hex');
                if (grad1) grad1.value = settings.color1;
                if (grad1Hex) grad1Hex.value = settings.color1;
                if (grad2) grad2.value = settings.color2;
                if (grad2Hex) grad2Hex.value = settings.color2;
            }

            updateBackgroundPreview();
        } catch (e) {
            console.error('Failed to load background settings:', e);
        }
    }
}

function saveBackgroundSettings() {
    const selectedType = document.querySelector('input[name="backgroundType"]:checked')?.value || 'solid';

    const settings = {
        type: selectedType
    };

    if (selectedType === 'solid') {
        settings.color = document.getElementById('customBgColor')?.value || '#ffffff';
    } else {
        settings.color1 = document.getElementById('gradientColor1')?.value || '#667eea';
        settings.color2 = document.getElementById('gradientColor2')?.value || '#764ba2';
    }

    localStorage.setItem('cpb_background_settings', JSON.stringify(settings));

    // Apply to the website
    applyBackgroundToSite(settings);
}

function applyBackgroundToSite(settings) {
    // This would need to update the styles.css :root variable
    // For now, we'll store it and it can be applied on page load
    const bodyStyle = settings.type === 'solid'
        ? settings.color
        : `linear-gradient(135deg, ${settings.color1} 0%, ${settings.color2} 100%)`;

    // We can apply it directly to show the change
    // In production, this would be in the main site's load logic
    console.log('Background to apply:', bodyStyle);
}

// Location Hours Management
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function toggleDayHours(day) {
    const checkbox = document.getElementById(`hours-${day}-enabled`);
    const inputs = document.getElementById(`hours-${day}-inputs`);

    if (checkbox.checked) {
        inputs.style.display = 'flex';
    } else {
        inputs.style.display = 'none';
    }
}

async function loadLocationHours() {
    // Try to get location hours from database
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.user.location_hours) {
            const hours = data.user.location_hours;

            DAYS_OF_WEEK.forEach(day => {
                if (hours[day]) {
                    const checkbox = document.getElementById(`hours-${day}-enabled`);
                    const openInput = document.getElementById(`hours-${day}-open`);
                    const closeInput = document.getElementById(`hours-${day}-close`);
                    const inputs = document.getElementById(`hours-${day}-inputs`);

                    if (checkbox) checkbox.checked = true;
                    if (openInput) openInput.value = hours[day].open || '';
                    if (closeInput) closeInput.value = hours[day].close || '';
                    if (inputs) inputs.style.display = 'flex';
                }
            });
        }
    } catch (error) {
        console.error('Failed to load location hours:', error);
    }
}

async function saveLocationHours() {
    const hours = {};

    DAYS_OF_WEEK.forEach(day => {
        const checkbox = document.getElementById(`hours-${day}-enabled`);
        if (checkbox && checkbox.checked) {
            const openInput = document.getElementById(`hours-${day}-open`);
            const closeInput = document.getElementById(`hours-${day}-close`);

            if (openInput && closeInput && openInput.value && closeInput.value) {
                hours[day] = {
                    open: openInput.value,
                    close: closeInput.value
                };
            }
        }
    });

    // Save to localStorage so public website can access it
    localStorage.setItem('cpb_location_hours', JSON.stringify(hours));

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const response = await fetch('/api/user/update-hours', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location_hours: hours })
        });

        const result = await response.json();
        if (!result.success) {
            console.error('Failed to save location hours:', result.error);
        }
    } catch (error) {
        console.error('Failed to save location hours:', error);
    }
}

// Custom Primary Colors Management
function initializeCustomColorPickers() {
    // Setup sync for all 6 color pickers
    const colorPairs = [
        { picker: 'primaryColor', hex: 'primaryColorHex' },
        { picker: 'secondaryColor', hex: 'secondaryColorHex' },
        { picker: 'accentColor', hex: 'accentColorHex' },
        { picker: 'headerColor', hex: 'headerColorHex' },
        { picker: 'footerColor', hex: 'footerColorHex' },
        { picker: 'textColor', hex: 'textColorHex' }
    ];

    colorPairs.forEach(pair => {
        const colorPicker = document.getElementById(pair.picker);
        const hexInput = document.getElementById(pair.hex);

        if (colorPicker && hexInput) {
            // Sync color picker -> hex input
            colorPicker.addEventListener('input', (e) => {
                hexInput.value = e.target.value;
                updateCustomColorPreview();
            });

            // Sync hex input -> color picker
            hexInput.addEventListener('input', (e) => {
                let value = e.target.value.trim();

                // Add # if missing
                if (value && !value.startsWith('#')) {
                    value = '#' + value;
                }

                // Validate hex color
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                    colorPicker.value = value;
                    hexInput.style.borderColor = 'var(--border)';
                    updateCustomColorPreview();
                } else if (value.length > 0) {
                    hexInput.style.borderColor = 'var(--danger-color)';
                }
            });
        }
    });
}

// Collapsible Sections for Customization Tab
function makeCustomizationCollapsible() {
    const customizationTab = document.getElementById('customization-tab');
    if (!customizationTab) return;

    const cards = customizationTab.querySelectorAll('.card');
    cards.forEach((card, index) => {
        const h2 = card.querySelector('h2');
        if (!h2) return;

        // Skip the last card if it's just the save button
        if (index === cards.length - 1 && !card.querySelector('.form-group')) return;

        // Add collapsible class to card
        card.classList.add('collapsible-card');
        card.classList.add('collapsed'); // Start collapsed by default

        // Make h2 clickable
        h2.style.cursor = 'pointer';
        h2.style.display = 'flex';
        h2.style.justifyContent = 'space-between';
        h2.style.alignItems = 'center';
        h2.style.userSelect = 'none';

        // Add toggle icon
        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.textContent = '▼';
        icon.style.transition = 'transform 0.3s ease';
        icon.style.transform = 'rotate(-90deg)'; // Start rotated (collapsed)
        h2.appendChild(icon);

        // Wrap content (everything except h2) in collapsible div
        const content = document.createElement('div');
        content.className = 'collapsible-content';
        content.style.maxHeight = '0'; // Start collapsed
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease';

        // Move all children except h2 into content wrapper
        const children = Array.from(card.children).filter(child => child !== h2);
        children.forEach(child => content.appendChild(child));
        card.appendChild(content);

        // Add click handler
        h2.addEventListener('click', () => {
            const isCollapsed = card.classList.toggle('collapsed');

            if (isCollapsed) {
                content.style.maxHeight = '0';
                icon.style.transform = 'rotate(-90deg)';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.style.transform = 'rotate(0)';
            }
        });
    });
}

// Call after DOM loads
setTimeout(makeCustomizationCollapsible, 100);

// Upload inventory from CSV
async function uploadInventoryCSV(csvData) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('Please log in first', true);
        return;
    }

    showToast('Uploading your inventory...');

    try {
        const response = await fetch('/api/user/upload-inventory-csv', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ csvData })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ Successfully imported ${result.count} buildings!`);
            await loadBuildings(); // Reload the buildings list
        } else {
            showToast(`❌ Import failed: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast(`❌ Upload error: ${error.message}`, true);
    }
}

function showCSVUpload() {
    // Create a file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvData = event.target.result;
            await uploadInventoryCSV(csvData);
        };
        reader.readAsText(file);
    };

    input.click();
}

// Sync user's inventory from GPB Sales (DISABLED - requires server with browser)
async function syncUserInventory(username, password) {
    showToast('⚠️ GPB Sales sync requires a server with browser support. Please use CSV upload instead.', true);
}

function showSyncModal() {
    showToast('⚠️ Direct GPB sync not available. Please export CSV from GPB Sales and upload it.', true);
    setTimeout(() => {
        showCSVUpload();
    }, 2000);
}

// Domain Management Functions
async function loadDomainInfo() {
    const user = window.currentUser;
    if (!user) return;

    // Show either subdomain picker or subdomain display
    const pickerCard = document.getElementById('subdomain-picker-card');
    const displayCard = document.getElementById('subdomain-display-card');

    if (!user.subdomain) {
        // User doesn't have subdomain yet - show picker
        if (pickerCard) pickerCard.style.display = 'block';
        if (displayCard) displayCard.style.display = 'none';

        // Pre-fill with business name suggestion if available
        if (user.businessName) {
            const suggestion = user.businessName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 30);

            const input = document.getElementById('subdomain-input');
            if (input && suggestion.length >= 3) {
                input.value = suggestion;
                // Trigger availability check
                checkSubdomainAvailability();
            }
        }
    } else {
        // User has subdomain - show display
        if (pickerCard) pickerCard.style.display = 'none';
        if (displayCard) displayCard.style.display = 'block';

        // Load subdomain URL
        const subdomainUrlEl = document.getElementById('subdomain-url');
        if (subdomainUrlEl) {
            subdomainUrlEl.textContent = `https://${user.subdomain}.shed-sync.com`;
        }
    }

    // Load custom domain if exists
    if (user.custom_domain) {
        const statusDiv = document.getElementById('custom-domain-status');
        const formDiv = document.getElementById('custom-domain-form');
        const domainText = document.getElementById('current-custom-domain-text');
        const badge = document.getElementById('domain-verification-badge');
        const inputField = document.getElementById('custom-domain-input');

        // Show status box
        if (statusDiv) statusDiv.style.display = 'block';
        if (domainText) domainText.textContent = user.custom_domain;

        // Update input field to show current domain
        if (inputField) inputField.value = user.custom_domain;

        // Update verification badge
        if (badge) {
            if (user.domain_verified) {
                badge.className = 'verification-status verified';
                badge.textContent = '✓ Verified';
            } else {
                badge.className = 'verification-status pending';
                badge.textContent = '⏳ Pending Verification';
            }
        }

        // Show DNS instructions if not verified
        if (!user.domain_verified) {
            document.getElementById('dns-instructions').style.display = 'block';

            // Auto-check domain status in background if pending
            // This will automatically verify the domain if DNS is configured
            setTimeout(() => {
                checkDomainVerification();
            }, 2000); // Check after 2 seconds to let page load
        }
    }

    // Load building stats
    const inventory = await getUserInventory();
    const overrides = getBuildingOverrides();

    document.getElementById('building-count').textContent = inventory.length;

    const availableCount = inventory.filter(b => {
        const override = overrides[b.serialNumber] || {};
        const status = override.status || 'available';
        return status === 'available' && !override.hidden;
    }).length;
    document.getElementById('available-count').textContent = availableCount;

    // Count photos
    let photoCount = 0;
    try {
        const imageOrders = dbCache.imageOrders || {};
        photoCount = Object.values(imageOrders).reduce((sum, images) => sum + images.length, 0);
    } catch (e) {
        // Fallback to checking localStorage
        for (const key in localStorage) {
            if (key.startsWith('cpb_image_order_')) {
                try {
                    const images = JSON.parse(localStorage.getItem(key));
                    if (Array.isArray(images)) {
                        photoCount += images.length;
                    }
                } catch (e) {}
            }
        }
    }
    document.getElementById('photo-count').textContent = photoCount;
}

function viewLiveSite() {
    const user = window.currentUser;
    if (!user) return;

    const url = user.custom_domain && user.domain_verified
        ? `https://${user.custom_domain}`
        : `https://${user.subdomain}.shed-sync.com`;

    window.open(url, '_blank');
}

function copySubdomainUrl() {
    const user = window.currentUser;
    if (!user) return;

    const url = `https://${user.subdomain}.shed-sync.com`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy URL', true);
    });
}

async function saveCustomDomain() {
    const input = document.getElementById('custom-domain-input');
    const domain = input.value.trim().toLowerCase();

    if (!domain) {
        showToast('Please enter a domain name', true);
        return;
    }

    // Validate domain format
    if (!/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i.test(domain)) {
        showToast('Please enter a valid domain (e.g., buytheshed.com)', true);
        return;
    }

    showToast('Saving custom domain...');

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user/save-custom-domain', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customDomain: domain })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Custom domain saved! Please configure DNS.');

            // Show domain status box
            const statusDiv = document.getElementById('custom-domain-status');
            const domainText = document.getElementById('current-custom-domain-text');
            const badge = document.getElementById('domain-verification-badge');

            if (statusDiv) statusDiv.style.display = 'block';
            if (domainText) domainText.textContent = domain;
            if (badge) {
                badge.className = 'verification-status pending';
                badge.textContent = '⏳ Pending Verification';
            }

            // Show DNS instructions
            document.getElementById('dns-instructions').style.display = 'block';

            // Update user object
            const user = window.currentUser;
            user.custom_domain = domain;
            user.domain_verified = false;
        } else {
            showToast('Failed to save custom domain: ' + (result.error || 'Unknown error'), true);
        }
    } catch (error) {
        console.error('Save custom domain error:', error);
        showToast('Failed to save custom domain', true);
    }
}

async function checkDomainVerification() {
    const btn = document.getElementById('check-verification-btn');
    const originalText = btn ? btn.textContent : '';

    if (btn) {
        btn.textContent = '🔄 Checking...';
        btn.disabled = true;
    }

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user/check-domain-status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success && result.hasDomain) {
            const badge = document.getElementById('domain-verification-badge');
            const user = window.currentUser;

            if (result.verified) {
                // Domain is verified!
                if (badge) {
                    badge.className = 'verification-status verified';
                    badge.textContent = '✓ Verified';
                }

                // Hide DNS instructions
                document.getElementById('dns-instructions').style.display = 'none';

                // Update user object
                user.domain_verified = true;

                if (result.autoVerified) {
                    showToast('✓ Domain verified successfully!');
                } else {
                    showToast('✓ Domain is verified and active!');
                }
            } else {
                // Still pending
                if (badge) {
                    badge.className = 'verification-status pending';
                    badge.textContent = '⏳ Pending Verification';
                }

                showToast(result.message || 'Domain not verified yet. Please check DNS configuration.', true);

                // Show helpful message
                if (result.helpText) {
                    setTimeout(() => showToast(result.helpText, true), 2000);
                }
            }
        } else {
            showToast('Unable to check domain status', true);
        }
    } catch (error) {
        console.error('Check domain verification error:', error);
        showToast('Failed to check domain status', true);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

async function removeCustomDomain() {
    if (!confirm('Remove your custom domain? Your site will only be accessible via subdomain.')) {
        return;
    }

    showToast('Removing custom domain...');

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user/remove-custom-domain', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showToast('Custom domain removed!');

            // Hide custom domain status, show form
            document.getElementById('custom-domain-status').style.display = 'none';
            document.getElementById('custom-domain-input').value = '';
            document.getElementById('dns-instructions').style.display = 'none';

            // Update user object
            const user = window.currentUser;
            user.custom_domain = null;
            user.domain_verified = false;
        } else {
            showToast('Failed to remove custom domain: ' + (result.error || 'Unknown error'), true);
        }
    } catch (error) {
        console.error('Remove custom domain error:', error);
        showToast('Failed to remove custom domain', true);
    }
}

// Subdomain picker functions
let subdomainCheckTimeout = null;

async function checkSubdomainAvailability() {
    const input = document.getElementById('subdomain-input');
    const validation = document.getElementById('subdomain-validation');
    const saveBtn = document.getElementById('save-subdomain-btn');

    if (!input || !validation || !saveBtn) return;

    const subdomain = input.value.trim().toLowerCase();

    // Clear previous timeout
    if (subdomainCheckTimeout) {
        clearTimeout(subdomainCheckTimeout);
    }

    // Reset button state
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.5';
    saveBtn.style.cursor = 'not-allowed';

    // Hide validation if empty
    if (!subdomain) {
        validation.style.display = 'none';
        return;
    }

    // Validate format
    const regex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;
    if (!regex.test(subdomain)) {
        validation.style.display = 'block';
        validation.style.color = '#f44336';
        validation.innerHTML = '❌ Invalid format. Use 3-30 characters: lowercase letters, numbers, hyphens.';
        return;
    }

    // Show checking message
    validation.style.display = 'block';
    validation.style.color = '#a8a8b8';
    validation.innerHTML = '⏳ Checking availability...';

    // Debounce the API call
    subdomainCheckTimeout = setTimeout(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/user/check-subdomain', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subdomain })
            });

            const result = await response.json();

            if (result.success) {
                if (result.available) {
                    validation.style.display = 'block';
                    validation.style.color = '#4caf50';
                    validation.innerHTML = '✅ Available! This subdomain is ready to claim.';

                    // Enable save button
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = '1';
                    saveBtn.style.cursor = 'pointer';
                } else {
                    validation.style.display = 'block';
                    validation.style.color = '#f44336';
                    validation.innerHTML = '❌ ' + (result.message || 'This subdomain is already taken.');
                }
            } else {
                validation.style.display = 'block';
                validation.style.color = '#f44336';
                validation.innerHTML = '❌ ' + (result.error || 'Unable to check availability.');
            }
        } catch (error) {
            console.error('Subdomain check error:', error);
            validation.style.display = 'block';
            validation.style.color = '#f44336';
            validation.innerHTML = '❌ Error checking availability. Please try again.';
        }
    }, 500); // 500ms debounce
}

async function saveSubdomain() {
    const input = document.getElementById('subdomain-input');
    const saveBtn = document.getElementById('save-subdomain-btn');

    if (!input || saveBtn.disabled) return;

    const subdomain = input.value.trim().toLowerCase();

    if (!subdomain) {
        showToast('Please enter a subdomain', true);
        return;
    }

    // Disable button during save
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Saving...';

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user/save-subdomain', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subdomain })
        });

        const result = await response.json();

        if (result.success) {
            showToast('🎉 Subdomain claimed successfully!');

            // Update current user object
            window.currentUser.subdomain = result.subdomain;

            // Reload domain info to show the new subdomain
            await loadDomainInfo();
        } else {
            showToast('Failed to save subdomain: ' + (result.error || 'Unknown error'), true);
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Claim This Subdomain';
        }
    } catch (error) {
        console.error('Save subdomain error:', error);
        showToast('Failed to save subdomain. Please try again.', true);
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Claim This Subdomain';
    }
}

function copyDnsValue() {
    const user = window.currentUser;
    if (!user) return;

    const value = `${user.subdomain}.shed-sync.com`;
    navigator.clipboard.writeText(value).then(() => {
        showToast('DNS value copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy DNS value', true);
    });
}

// Subscription & Billing Management
async function loadSubscriptionInfo() {
    try {
        const response = await fetch('/api/subscription/get-info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Update subscription info
            if (data.subscription) {
                const sub = data.subscription;

                // Check if user is on trial
                if (sub.status === 'trial') {
                    if (sub.isTrialExpired) {
                        // TRIAL EXPIRED - Show urgent upgrade message
                        document.getElementById('subscription-plan').innerHTML = '<span style="color: #f44336; font-weight: bold;">⚠️ Trial Expired</span>';
                        document.getElementById('subscription-amount').innerHTML = '<span style="color: #f44336; font-weight: bold;">Upgrade Required</span>';
                        document.getElementById('subscription-status').innerHTML = '<span style="color: #f44336;">● Expired</span>';
                        document.getElementById('subscription-next-billing').textContent = '—';

                        // Add urgent upgrade banner
                        const upgradeHTML = `
                            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; text-align: center;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">🚨 Your Trial Has Ended</h3>
                                <p style="margin: 0 0 1rem 0; font-size: 0.95rem; opacity: 0.95;">Your public website is currently offline. Upgrade now to reactivate your site and unlock all features.</p>
                                <button class="btn" onclick="upgradeToPremium()" style="background: white; color: #f44336; font-weight: bold; padding: 1rem 2rem; font-size: 1.1rem;">
                                    💳 Upgrade to Premium - $99/month
                                </button>
                            </div>
                        `;
                        document.getElementById('subscription-info').insertAdjacentHTML('beforeend', upgradeHTML);

                    } else {
                        // TRIAL ACTIVE - Show countdown
                        document.getElementById('subscription-plan').textContent = 'Free Trial';
                        document.getElementById('subscription-amount').innerHTML = '<span style="color: #4caf50; font-weight: bold;">$0 (Trial)</span>';
                        document.getElementById('subscription-status').innerHTML = `<span style="color: #ff9800;">🕐 ${sub.hoursRemaining} hours remaining</span>`;
                        document.getElementById('subscription-next-billing').innerHTML = `<span style="color: #666; font-size: 0.9rem;">Trial ends: ${new Date(sub.trialEndsAt).toLocaleString()}</span>`;

                        // Add upgrade button
                        const upgradeHTML = `
                            <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffe5b4 100%); border-left: 4px solid #ff9800; padding: 1.25rem; border-radius: 8px; margin-top: 1.5rem;">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="font-size: 2rem;">⏰</div>
                                    <div style="flex: 1;">
                                        <strong style="color: #856404; font-size: 1.05rem; display: block; margin-bottom: 0.25rem;">Trial Period Active</strong>
                                        <p style="margin: 0; color: #856404; font-size: 0.9rem;">You have ${sub.hoursRemaining} hours remaining. Upgrade anytime to keep your site running after the trial ends.</p>
                                    </div>
                                    <button class="btn btn-warning" onclick="upgradeToPremium()" style="padding: 0.75rem 1.5rem; white-space: nowrap;">
                                        ⬆️ Upgrade Now
                                    </button>
                                </div>
                            </div>
                        `;
                        document.getElementById('subscription-info').insertAdjacentHTML('beforeend', upgradeHTML);
                    }
                } else {
                    // PAID SUBSCRIPTION - Show normal info
                    document.getElementById('subscription-plan').textContent = 'Monthly Subscription';
                    document.getElementById('subscription-status').innerHTML = '<span style="color: #4caf50;">● Active</span>';
                    document.getElementById('subscription-next-billing').textContent = sub.nextBillingDate || '—';

                    // Update amount if available
                    if (sub.amount && sub.interval) {
                        document.getElementById('subscription-amount').textContent = `$${sub.amount}/${sub.interval}`;
                    } else {
                        document.getElementById('subscription-amount').textContent = '$99/month';
                    }
                }
            }

            // Update payment method info
            if (data.paymentMethod) {
                document.getElementById('card-info').textContent =
                    `${data.paymentMethod.brand} •••• ${data.paymentMethod.last4}`;
                document.getElementById('card-expires').textContent =
                    `Expires ${data.paymentMethod.expMonth}/${data.paymentMethod.expYear}`;
            }

            // Load billing history
            if (data.invoices && data.invoices.length > 0) {
                const tbody = document.getElementById('billing-history-body');
                tbody.innerHTML = data.invoices.map(invoice => `
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 0.75rem;">${new Date(invoice.date).toLocaleDateString()}</td>
                        <td style="padding: 0.75rem;">${invoice.description}</td>
                        <td style="padding: 0.75rem;">$${(invoice.amount / 100).toFixed(2)}</td>
                        <td style="padding: 0.75rem;">
                            <span style="color: ${invoice.status === 'paid' ? '#4caf50' : '#f44336'};">
                                ${invoice.status}
                            </span>
                        </td>
                        <td style="padding: 0.75rem;">
                            ${invoice.receiptUrl ? `<a href="${invoice.receiptUrl}" target="_blank" style="color: #2196f3;">View</a>` : '—'}
                        </td>
                    </tr>
                `).join('');
            } else {
                document.getElementById('billing-history-body').innerHTML = `
                    <tr>
                        <td colspan="5" style="padding: 2rem; text-align: center; color: #999;">
                            No billing history yet
                        </td>
                    </tr>
                `;
            }
        }

    } catch (error) {
        console.error('Error loading subscription info:', error);
    }
}

// Upgrade to premium subscription with PayPal
async function upgradeToPremium() {
    // Show PayPal modal
    showPayPalModal();
}

// Show PayPal subscription modal
function showPayPalModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; position: relative;">
            <button onclick="this.closest('div').parentElement.remove()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
            <h2 style="margin: 0 0 1rem 0; color: #333;">Upgrade to Premium</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">Subscribe for $99/month to unlock all features and keep your website online.</p>
            <div id="paypal-button-container-P-5PJ478448J561845UNDX7TCY"></div>
        </div>
    `;

    document.body.appendChild(modal);

    // Load PayPal SDK if not already loaded
    if (!window.paypal) {
        const script = document.createElement('script');
        // PRODUCTION mode - Using live client ID for real payments
        script.src = 'https://www.paypal.com/sdk/js?client-id=ASrPuLELj3KGaVCXey5vpevgIvF7UFkXTQfQM0MHw1_hlk9MZy0Wq2jt9S0xrpNWb80ZEyzu0K_x5KKG&vault=true&intent=subscription';
        script.setAttribute('data-sdk-integration-source', 'button-factory');
        script.onload = () => renderPayPalButton();
        document.head.appendChild(script);
    } else {
        renderPayPalButton();
    }
}

// Render PayPal subscription button
function renderPayPalButton() {
    const token = localStorage.getItem('auth_token');

    paypal.Buttons({
        style: {
            shape: 'pill',
            color: 'gold',
            layout: 'horizontal',
            label: 'subscribe'
        },
        createSubscription: function(data, actions) {
            return actions.subscription.create({
                plan_id: 'P-5PJ478448J561845UNDX7TCY'
            });
        },
        onApprove: async function(data, actions) {
            console.log('PayPal subscription approved:', data.subscriptionID);

            // Send subscription ID to backend to activate user
            try {
                const response = await fetch('/api/subscription/paypal-activate', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscriptionId: data.subscriptionID
                    })
                });

                const result = await response.json();
                if (result.success) {
                    showToast('Subscription activated successfully! Refreshing page...');
                    // Close modal
                    document.querySelectorAll('div[style*="position: fixed"]').forEach(el => el.remove());
                    // Reload page after 2 seconds to show updated status
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    showToast('Subscription created but activation failed: ' + result.error, true);
                }
            } catch (error) {
                console.error('Activation error:', error);
                showToast('Subscription created but activation failed', true);
            }
        },
        onError: function(err) {
            console.error('PayPal error:', err);
            showToast('Payment failed. Please try again.', true);
        },
        onCancel: function(data) {
            console.log('PayPal subscription cancelled');
            showToast('Subscription cancelled');
        }
    }).render('#paypal-button-container-P-5PJ478448J561845UNDX7TCY');
}

// Update payment method - PayPal subscriptions are managed through PayPal
async function updatePaymentMethod() {
    const token = localStorage.getItem('auth_token');
    try {
        // Get current subscription status
        const response = await fetch('/api/user/settings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.subscription) {
            const sub = data.subscription;

            // Check if user is on trial
            if (sub.status === 'trial') {
                // Trial user - offer upgrade
                if (confirm('You are currently on a free trial. Would you like to upgrade to the paid plan ($99/month)?')) {
                    upgradeToPremium();
                }
            } else if (sub.status === 'active' && sub.paypalSubscriptionId) {
                // Active PayPal subscriber - show PayPal management instructions
                const modal = document.createElement('div');
                modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
                modal.innerHTML = `
                    <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                        <h3 style="margin: 0 0 1rem 0; color: #1a1a2e;">Manage PayPal Subscription</h3>
                        <p style="margin: 0 0 1.5rem 0; color: #666; line-height: 1.6;">
                            Your subscription is managed through PayPal. To update your payment method or cancel your subscription:
                        </p>
                        <ol style="margin: 0 0 1.5rem 0; color: #666; line-height: 1.8; padding-left: 1.5rem;">
                            <li>Log in to your PayPal account</li>
                            <li>Click on <strong>Settings</strong> (gear icon)</li>
                            <li>Click <strong>Payments</strong></li>
                            <li>Click <strong>Manage automatic payments</strong></li>
                            <li>Find <strong>Shed-Sync Premium</strong></li>
                            <li>Update payment method or cancel</li>
                        </ol>
                        <div style="display: flex; gap: 1rem;">
                            <a href="https://www.paypal.com/myaccount/autopay/" target="_blank" class="btn" style="flex: 1; text-align: center; background: linear-gradient(135deg, #0070ba 0%, #1546a0 100%); color: white; text-decoration: none; display: block; padding: 0.75rem;">
                                Open PayPal Settings
                            </a>
                            <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" class="btn" style="flex: 1; background: #e0e0e0; color: #333;">
                                Close
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                // No active subscription
                if (confirm('No active subscription found. Would you like to upgrade to premium now?')) {
                    upgradeToPremium();
                }
            }
        } else {
            showToast('Unable to load subscription information', true);
        }
    } catch (error) {
        console.error('Subscription check error:', error);
        showToast('Failed to check subscription status', true);
    }
}

// Feature Request Functions
function openFeatureRequest() {
    const modal = document.getElementById('feature-request-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous values
        document.getElementById('featureTitle').value = '';
        document.getElementById('featureDescription').value = '';
    }
}

function closeFeatureRequest() {
    const modal = document.getElementById('feature-request-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitFeatureRequest() {
    const title = document.getElementById('featureTitle').value.trim();
    const description = document.getElementById('featureDescription').value.trim();

    if (!title) {
        showToast('Please enter a title for your feature request', true);
        return;
    }

    if (!description) {
        showToast('Please describe your feature request', true);
        return;
    }

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/feature-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('✅ Feature request submitted successfully!');
            closeFeatureRequest();
        } else {
            showToast(`❌ Failed to submit: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Feature request error:', error);
        showToast('❌ Failed to submit feature request', true);
    }
}

// Export functions to global scope
window.saveSettings = saveSettings;
window.saveCustomization = saveCustomization;
window.saveWelcomeMessage = saveWelcomeMessage;
window.addCarouselImage = addCarouselImage;
window.removeCarouselImage = removeCarouselImage;
window.saveCarousel = saveCarousel;
window.setBuildingStatus = setBuildingStatus;
window.toggleBuildingVisibility = toggleBuildingVisibility;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.removeBuildingImage = removeBuildingImage;
window.setMainImage = setMainImage;
window.getBuildingImages = getBuildingImages;
window.addLot = addLot;
window.removeLot = removeLot;
window.syncLot = syncLot;
window.triggerManualSync = triggerManualSync;
window.saveGpbCredentials = saveGpbCredentials;
window.triggerUserSync = triggerUserSync;
window.resetButtonColor = resetButtonColor;
window.checkAndPostToFacebook = checkAndPostToFacebook;
window.testFacebookPost = testFacebookPost;
window.postBuildingToFacebook = postBuildingToFacebook;
window.toggleDayHours = toggleDayHours;
window.syncUserInventory = syncUserInventory;
window.showSyncModal = showSyncModal;
window.uploadInventoryCSV = uploadInventoryCSV;
window.showCSVUpload = showCSVUpload;
window.viewLiveSite = viewLiveSite;
window.copySubdomainUrl = copySubdomainUrl;
window.saveCustomDomain = saveCustomDomain;
window.removeCustomDomain = removeCustomDomain;
window.checkDomainVerification = checkDomainVerification;
window.copyDnsValue = copyDnsValue;
window.updatePaymentMethod = updatePaymentMethod;
window.checkSubdomainAvailability = checkSubdomainAvailability;
window.saveSubdomain = saveSubdomain;
window.openFeatureRequest = openFeatureRequest;
window.closeFeatureRequest = closeFeatureRequest;
window.submitFeatureRequest = submitFeatureRequest;

// Facebook Template Library Functions
const facebookTemplates = {
    1: {
        title: "🚨 New Arrival Alert",
        strategy: ["URGENCY", "SCARCITY"],
        template: `🚨 JUST ARRIVED! {{name}}

📐 Size: {{size}}
💰 Cash Price: {{price}}
📍 Currently at: {{location}}

⚡ Won't last long - buildings like this sell FAST!

{{rtoAll}}

📞 Call NOW: {{phone}}
💬 DM us to reserve before it's gone!

#PortableBuildings #{{type}} #NewArrival #LimitedAvailability`
    },
    2: {
        title: "❓ Question Hook",
        strategy: ["ENGAGEMENT", "VALUE"],
        template: `❓ Need extra storage space but short on cash?

✅ Here's your solution: {{name}}

📏 Perfect {{size}} - ideal for tools, equipment, or hobby space
💵 Only {{price}} cash OR flexible rent-to-own!

📍 Ready for delivery to {{location}} area

No credit check • Same day approval • FREE delivery available

{{rtoAll}}

👉 Call {{phone}} or comment "INTERESTED" below!

#StorageSolution #{{type}} #RentToOwn #NoCredit`
    },
    3: {
        title: "💥 Price Drop",
        strategy: ["URGENCY", "VALUE"],
        template: `💥 PRICE DROP ALERT! 💥

This {{name}} just got MORE affordable!

Was: $XX,XXX → NOW: {{price}} ✅

📐 {{size}} of premium space
📍 Located at {{location}}
🚚 FREE delivery within 50 miles

⏰ This price won't last - First come, first served!

Can't pay cash? No problem!
{{rtoAll}}

📞 Text or call: {{phone}}
⚡ Move fast on this one!

#DealAlert #{{type}} #PriceDrop #LimitedTime`
    },
    4: {
        title: "⭐ Customer Favorite",
        strategy: ["SOCIAL PROOF", "VALUE"],
        template: `⭐⭐⭐⭐⭐ OUR BEST SELLER!

The {{name}} - loved by dozens of happy customers! 🎉

Why people choose this model:
✅ Perfect {{size}} size
✅ Quality construction that lasts
✅ Versatile for ANY use
✅ Affordable at {{price}}

📍 In stock at {{location}}
🚚 We deliver & set up for FREE

"Best investment I made for my property!" - Recent Customer

{{rtoAll}}

📞 Join our happy customers! Call {{phone}}
💬 Or message us to schedule a visit

#CustomerFavorite #{{type}} #BestSeller #5Star`
    },
    5: {
        title: "🎯 Weekend Deal",
        strategy: ["URGENCY", "SCARCITY"],
        template: `🎯 WEEKEND SPECIAL - This Weekend ONLY! 🎯

{{name}} - {{size}}

💰 Special Price: {{price}}
⏰ Offer expires Sunday at midnight!

🎁 BONUS: Order this weekend and get:
✅ FREE delivery
✅ FREE setup
✅ FREE anchoring

📍 {{location}} location
🚀 Can deliver as early as next week!

Low monthly payments available:
{{rto48}}

⚠️ Don't miss out - only this weekend!

📞 Call or text: {{phone}}
💬 Comment "WEEKEND DEAL" to claim

#WeekendSpecial #{{type}} #LimitedTime #FreebiesFriday`
    },
    6: {
        title: "🔧 Problem Solver",
        strategy: ["ENGAGEMENT", "VALUE"],
        template: `🔧 Tired of clutter in your garage?
🏡 Need a workshop but don't want to build?
💼 Want a home office away from distractions?

👉 Meet the {{name}}!

Your perfect solution:
📏 Spacious {{size}}
💪 Built tough to last decades
💵 Surprisingly affordable: {{price}}
🚚 We deliver & install - you do NOTHING

No more excuses! Get organized TODAY.

{{rtoAll}}

📍 Visit us at {{location}} OR
📞 Call {{phone}} for FREE quote

Transform your property this month! 🎯

#ProblemSolved #{{type}} #Organization #ExtraSpace`
    },
    7: {
        title: "🔥 Last One!",
        strategy: ["SCARCITY", "URGENCY"],
        template: `🔥 LAST ONE IN STOCK! 🔥

This is THE ONLY {{name}} we have left!

📐 Size: {{size}}
💰 Price: {{price}}
📍 Location: {{location}}

⚠️ Once it's gone, it's GONE!
Next shipment not expected for 4-6 weeks.

✅ Perfect for storage, workshop, or extra space
✅ Quality built - made to last
✅ Ready for immediate delivery

Don't wait and regret it!

As low as {{rto60}}/month with RTO

📞 CALL NOW: {{phone}}
💬 Or DM "LAST ONE" - First response gets it!

#LastChance #{{type}} #OnlyOneLeft #ActFast`
    },
    8: {
        title: "✨ Feature Spotlight",
        strategy: ["VALUE", "QUALITY"],
        template: `✨ FEATURE SPOTLIGHT: {{name}}

What makes this {{type}} special? Let us show you! 👇

🏆 Premium Features:
✅ Heavy-duty floor joists
✅ High-quality siding
✅ Extra tall sidewalls ({{size}})
✅ Reinforced door frames
✅ Weather-resistant construction

💰 All this for just {{price}}!

📍 See it in person at {{location}}

🎯 Perfect for:
• Tool storage
• Workshop
• Man cave/She shed
• Home gym
• Art studio

Can't afford cash? We got you!
{{rtoAll}}

📞 Schedule your visit: {{phone}}
📸 More photos in comments!

#QualityBuilt #{{type}} #PremiumFeatures #BuiltToLast`
    },
    9: {
        title: "💡 Smart Money",
        strategy: ["VALUE", "LOGIC"],
        template: `💡 SMART MONEY COMPARISON 💡

Building yourself? Think again! 👇

DIY Cost:
❌ Materials: $4,000-$6,000
❌ Tools: $500-$1,000
❌ Your time: 60+ hours
❌ Permits & fees: $200-$500
❌ Total: $5,000-$8,000+ 😰

Our {{name}}:
✅ Professionally built: {{price}}
✅ FREE delivery & setup
✅ Ready in DAYS not weeks
✅ No stress, no sweat!

📐 {{size}} - Perfect size!
📍 {{location}}

Why work harder when you can work smarter?

Low as {{rto72}}/month

📞 Get yours today: {{phone}}
⏰ Don't waste another weekend!

#SmartShopping #{{type}} #ValueBuy #WhyDIY`
    },
    10: {
        title: "🎄 Seasonal Special",
        strategy: ["URGENCY", "SEASONAL"],
        template: `🎄 [SEASON] SPECIAL EVENT! 🎄

Make room for [holiday/season] with extra storage!

{{name}} - NOW AVAILABLE! 🎉

📐 {{size}} - More space than you think!
💰 Special [Season] Price: {{price}}
📍 {{location}}

🎁 [SEASON] BONUS INCLUDED:
✅ FREE delivery
✅ FREE setup
✅ [Extra seasonal bonus]

Perfect timing to:
• Organize holiday decorations
• Clear out the garage
• Create that workshop you've wanted
• [Seasonal use case]

{{rtoAll}}

⏰ [Season] special ends [Date]!

📞 Reserve yours: {{phone}}
💬 Comment "[SEASON]" for details

#[Season]Sale #{{type}} #LimitedOffer #[Holiday]`
    }
};

function loadTemplateLibrary() {
    const container = document.getElementById('template-library-container');
    if (!container) return;

    const strategyColors = {
        'URGENCY': '#dc3545',
        'SCARCITY': '#fd7e14',
        'VALUE': '#28a745',
        'SOCIAL PROOF': '#6f42c1',
        'ENGAGEMENT': '#17a2b8',
        'QUALITY': '#6f42c1',
        'LOGIC': '#17a2b8',
        'SEASONAL': '#fd7e14'
    };

    // Example preview data for each template
    const previewExamples = {
        1: { name: '12x24 Lofted Barn', size: '12x24', price: '$8,995', location: 'Monroe, LA', type: 'LoftedBarn', rto: '• 36 months: $312.45/mo\n• 48 months: $249.78/mo\n• 60 months: $211.56/mo\n• 72 months: $186.23/mo' },
        2: { name: '10x16 Utility Shed', size: '10x16', price: '$4,495', location: 'Ruston', type: 'UtilityShed', rto: '• 36 months: $156.23/mo\n• 48 months: $124.89/mo\n• 60 months: $105.78/mo\n• 72 months: $93.12/mo' },
        3: { name: '12x20 Lofted Barn Cabin', size: '12x20', price: '$8,495', location: 'West Monroe', type: 'LoftedBarnCabin', rto: '• 36 months: $295.12/mo\n• 48 months: $236.09/mo\n• 60 months: $200.08/mo\n• 72 months: $176.07/mo' },
        4: { name: '10x12 Lofted Barn', size: '10x12', price: '$5,295', location: 'Bastrop, LA', type: 'LoftedBarn', rto: '• 36 months: $184.01/mo\n• 48 months: $147.21/mo\n• 60 months: $124.68/mo\n• 72 months: $109.80/mo' },
        5: { name: '8x12 Mini Shed', size: '8x12', price: '$3,295', location: 'Pineville', type: 'MiniShed', rto: '48 months: $91.12/mo' },
        6: { name: '12x16 Utility Building', size: '12x16', price: '$6,295', location: 'Shreveport', type: 'UtilityBuilding', rto: '• 36 months: $218.80/mo\n• 48 months: $175.04/mo\n• 60 months: $148.28/mo\n• 72 months: $130.58/mo' },
        7: { name: '10x20 Side Lofted Barn', size: '10x20', price: '$7,495', location: 'Alexandria', type: 'SideLoftedBarn', rto: '60 months: $158.23/mo' },
        8: { name: '14x28 Lofted Barn Cabin', size: '14x28', price: '$12,995', location: 'Lake Charles', type: 'LoftedBarnCabin', rto: '• 36 months: $451.73/mo\n• 48 months: $361.38/mo\n• 60 months: $306.17/mo\n• 72 months: $269.63/mo' },
        9: { name: '10x14 Utility Shed', size: '10x14', price: '$5,495', location: 'Natchitoches', type: 'UtilityShed', rto: '72 months: $121.45/mo' },
        10: { name: '12x16 Lofted Barn', size: '12x16', price: '$6,995', location: 'Bossier City', type: 'LoftedBarn', rto: '• 36 months: $243.23/mo\n• 48 months: $194.58/mo\n• 60 months: $164.79/mo\n• 72 months: $145.15/mo' }
    };

    container.innerHTML = Object.keys(facebookTemplates).map(num => {
        const template = facebookTemplates[num];
        const example = previewExamples[num];

        // Generate preview text by replacing placeholders
        let previewText = template.template
            .replace(/\{\{name\}\}/g, example.name)
            .replace(/\{\{size\}\}/g, example.size)
            .replace(/\{\{price\}\}/g, example.price)
            .replace(/\{\{location\}\}/g, example.location)
            .replace(/\{\{type\}\}/g, example.type)
            .replace(/\{\{phone\}\}/g, '318-594-5909')
            .replace(/\{\{rtoAll\}\}/g, `Rent-to-Own Options:\n${example.rto}\n*Plus your local sales tax`)
            .replace(/\{\{rto36\}\}/g, example.rto.split('\n')[0] || '')
            .replace(/\{\{rto48\}\}/g, example.rto.split('\n')[1] || example.rto)
            .replace(/\{\{rto60\}\}/g, example.rto.split('\n')[2] || example.rto)
            .replace(/\{\{rto72\}\}/g, example.rto.split('\n')[3] || example.rto);

        return `
            <div style="background: white; border: 2px solid #dee2e6; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #1877f2 0%, #1465d8 100%); color: white; padding: 1.5rem;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">
                        Template #${num}
                    </div>
                    <div style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">
                        ${template.title}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${template.strategy.map(s => `
                            <span style="display: inline-block; background: ${strategyColors[s] || '#28a745'}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                                ${s}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- Two-column layout: Template Code + Preview -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
                    <!-- Left column: Template code -->
                    <div style="padding: 1.5rem; background: #f8f9fa; border-right: 2px solid #dee2e6;">
                        <div style="font-weight: 700; color: #1a1a2e; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #dee2e6; font-size: 0.95rem;">
                            📝 Template Code
                        </div>
                        <div style="background: white; border: 2px dashed #dee2e6; border-radius: 8px; padding: 1rem; font-family: 'Courier New', monospace; font-size: 0.85rem; white-space: pre-wrap; color: #495057; line-height: 1.8; max-height: 400px; overflow-y: auto;">
${template.template}</div>
                    </div>

                    <!-- Right column: Facebook preview -->
                    <div style="padding: 1.5rem; background: white;">
                        <div style="font-weight: 700; color: #1a1a2e; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #dee2e6; font-size: 0.95rem;">
                            👁️ How It Looks on Facebook
                        </div>
                        <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; max-height: 400px; overflow-y: auto;">
                            <!-- Facebook post header -->
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e4e6eb;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #1877f2 0%, #1465d8 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.1rem;">
                                    🏠
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 700; font-size: 0.95rem; color: #050505;">Your Business Name</div>
                                    <div style="font-size: 0.8rem; color: #65676b;">Just now · 🌎</div>
                                </div>
                            </div>
                            <!-- Facebook post content -->
                            <div style="font-size: 0.95rem; color: #050505; white-space: pre-wrap; line-height: 1.5;">
${previewText}</div>
                        </div>
                    </div>
                </div>

                <!-- Use template button -->
                <div style="padding: 1.5rem; background: white; border-top: 2px solid #dee2e6;">
                    <button onclick="useTemplate(${num})" style="width: 100%; background: #28a745; color: white; border: none; padding: 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.3s ease;">
                        ✨ Use This Template
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function useTemplate(templateNum) {
    const template = facebookTemplates[templateNum];
    if (!template) return;

    // Get the textarea in the Facebook tab
    const textarea = document.getElementById('autoPostTemplate-2');
    if (textarea) {
        textarea.value = template.template;

        // Auto-save the template
        await saveFacebookTemplate(template.template);

        // Scroll to the template textarea
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Flash the textarea to show it was updated
        textarea.style.border = '3px solid #28a745';
        setTimeout(() => {
            textarea.style.border = '';
        }, 1500);

        showToast(`✅ Template #${templateNum} loaded and saved!`);
    }
}

// Load template library when the Facebook tab is opened
document.addEventListener('DOMContentLoaded', () => {
    // Load templates immediately if on Facebook tab
    if (document.getElementById('template-library-container')) {
        loadTemplateLibrary();
    }

    // Load Facebook schedule settings
    loadFacebookSchedule();

    // Initialize auto-save for schedule settings
    initScheduleAutoSave();

    // Also load when tab is switched to Facebook
    const facebookTabBtn = document.querySelector('[data-tab="facebook"]');
    if (facebookTabBtn) {
        facebookTabBtn.addEventListener('click', () => {
            setTimeout(loadTemplateLibrary, 100);
            setTimeout(loadFacebookSchedule, 100);
        });
    }

    // Sync the duplicate Facebook settings fields
    syncFacebookFields();
});

// Sync Facebook settings between original location and new tab
function syncFacebookFields() {
    // Sync checkboxes
    const syncCheckbox = (id1, id2) => {
        const el1 = document.getElementById(id1);
        const el2 = document.getElementById(id2);
        if (el1 && el2) {
            el1.addEventListener('change', () => el2.checked = el1.checked);
            el2.addEventListener('change', () => el1.checked = el2.checked);
        }
    };

    syncCheckbox('enableAutoPost', 'enableAutoPost-2');
    syncCheckbox('autoPostNewOnly', 'autoPostNewOnly-2');
    syncCheckbox('autoPostWithImages', 'autoPostWithImages-2');
    syncCheckbox('autoPostAvailableOnly', 'autoPostAvailableOnly-2');

    // Sync textareas
    const syncTextarea = (id1, id2) => {
        const el1 = document.getElementById(id1);
        const el2 = document.getElementById(id2);
        if (el1 && el2) {
            el1.addEventListener('input', () => el2.value = el1.value);
            el2.addEventListener('input', () => el1.value = el2.value);
        }
    };

    syncTextarea('autoPostTemplate', 'autoPostTemplate-2');

    // Sync connection status
    const syncConnectionStatus = () => {
        const connected1 = document.getElementById('facebook-connected');
        const notConnected1 = document.getElementById('facebook-not-connected');
        const connected2 = document.getElementById('facebook-connected-2');
        const notConnected2 = document.getElementById('facebook-not-connected-2');
        const pageName1 = document.getElementById('connected-page-name');
        const pageName2 = document.getElementById('connected-page-name-2');

        if (connected1 && connected2 && notConnected1 && notConnected2) {
            // Copy display state
            connected2.style.display = connected1.style.display;
            notConnected2.style.display = notConnected1.style.display;

            // Copy page name
            if (pageName1 && pageName2) {
                pageName2.textContent = pageName1.textContent;
            }
        }
    };

    // Sync status periodically
    setInterval(syncConnectionStatus, 500);
}

window.useTemplate = useTemplate;
window.loadTemplateLibrary = loadTemplateLibrary;

// Facebook OAuth Functions
async function connectFacebookOAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('Please log in first', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/facebook-oauth-start', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.authUrl) {
            // Open Facebook OAuth in a popup
            const width = 600;
            const height = 700;
            const left = (screen.width / 2) - (width / 2);
            const top = (screen.height / 2) - (height / 2);

            window.open(
                data.authUrl,
                'Facebook Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Listen for the popup to close and reload data
            const checkInterval = setInterval(() => {
                loadFacebookConnectionStatus();
            }, 2000);

            // Stop checking after 2 minutes
            setTimeout(() => clearInterval(checkInterval), 120000);
        } else {
            showToast('Failed to start Facebook connection', true);
        }
    } catch (error) {
        console.error('Error starting Facebook OAuth:', error);
        showToast('Error connecting to Facebook', true);
    }
}

async function disconnectFacebook() {
    if (!confirm('Are you sure you want to disconnect your Facebook page? Auto-posting will stop working.')) {
        return;
    }

    const token = localStorage.getItem('auth_token');
    try {
        // Remove Facebook settings from database
        await saveSetting('cpb_facebook_page_id', null);
        await saveSetting('cpb_facebook_access_token', null);
        await saveSetting('cpb_facebook_page_name', null);

        showToast('Facebook page disconnected successfully');
        loadFacebookConnectionStatus();
    } catch (error) {
        console.error('Error disconnecting Facebook:', error);
        showToast('Failed to disconnect Facebook', true);
    }
}

async function loadFacebookConnectionStatus() {
    // Reload settings from database to ensure we have latest Facebook config
    await loadFromDatabase();

    const pageName = getSetting('cpb_facebook_page_name', null);
    const pageId = getSetting('cpb_facebook_page_id', null);

    const connectedDiv = document.getElementById('facebook-connected-2');
    const notConnectedDiv = document.getElementById('facebook-not-connected-2');

    if (pageName && pageId) {
        // Show connected status
        const nameElement = document.getElementById('connected-page-name-2');
        if (nameElement) {
            nameElement.textContent = pageName;
        }
        if (connectedDiv) connectedDiv.style.display = 'block';
        if (notConnectedDiv) notConnectedDiv.style.display = 'none';
    } else {
        // Show not connected
        if (connectedDiv) connectedDiv.style.display = 'none';
        if (notConnectedDiv) notConnectedDiv.style.display = 'block';
    }
}

// Listen for Facebook OAuth popup messages
window.addEventListener('message', (event) => {
    // Only accept messages from our own origin
    if (event.origin !== window.location.origin) {
        return;
    }

    if (event.data.type === 'facebook_connected') {
        showToast(`✅ Successfully connected to Facebook page: ${event.data.pageName}`);
        // Reload page to show connected status
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    if (event.data.type === 'use_facebook_template') {
        // Load template into the post template textarea
        const templateTextarea = document.getElementById('autoPostTemplate');
        if (templateTextarea) {
            templateTextarea.value = event.data.template;
            // Auto-save the template
            saveFacebookTemplate(event.data.template);
        }
    }
});

// Check for OAuth callback success/error on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);

    // Handle Facebook OAuth callback
    if (urlParams.get('fb_success')) {
        const pageName = urlParams.get('page_name');
        showToast(`✅ Successfully connected to Facebook page: ${pageName}`);
        loadFacebookConnectionStatus();

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname + '#customization');
    }

    if (urlParams.get('fb_error')) {
        const error = urlParams.get('fb_error');
        showToast(`❌ Facebook connection failed: ${error}`, true);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname + '#customization');
    }

    // Handle Google OAuth callback redirect
    if (urlParams.get('tab') === 'marketing' && urlParams.get('platform') === 'google') {
        // Wait a moment for page to fully load
        setTimeout(() => {
            // Switch to marketing tab
            const marketingTab = document.querySelector('[data-tab="marketing"]');
            if (marketingTab) {
                marketingTab.click();
            }

            // Show Google section
            setTimeout(() => {
                showMarketingPlatform('google');

                // Load connection status first
                loadGoogleBusinessConnectionStatus();

                // If location selector flag is present, open it after connection status loads
                if (urlParams.get('show_location_selector') === 'true') {
                    console.log('[Google OAuth] Location selector flag detected');
                    setTimeout(() => {
                        // Check if multiple locations exist before showing selector
                        const token = localStorage.getItem('auth_token');
                        const user = window.currentUser;

                        console.log('[Google OAuth] Checking locations, user:', user);

                        if (token && user && user.id) {
                            fetch(`/api/google-business/list-locations?userId=${user.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                            .then(res => res.json())
                            .then(data => {
                                console.log('[Google OAuth] Locations data:', data);
                                if (data.success && data.locations && data.locations.length > 1) {
                                    console.log('[Google OAuth] Multiple locations found, opening selector');
                                    openLocationSelector();
                                } else if (data.locations && data.locations.length === 1) {
                                    console.log('[Google OAuth] Single location found');
                                    showToast('✅ Connected to your Google Business location');
                                } else {
                                    console.log('[Google OAuth] No locations or error:', data.error);
                                    if (data.error) {
                                        showToast(`⚠️ ${data.error}`, true);
                                    }
                                }
                            })
                            .catch(err => {
                                console.error('[Google OAuth] Error checking locations:', err);
                                showToast('⚠️ Could not load locations. Try clicking "Change Location" button.', true);
                            });
                        } else {
                            console.error('[Google OAuth] No token or user available');
                        }

                        // Clean up URL
                        window.history.replaceState({}, document.title, '/admin.html');
                    }, 1500);
                }
            }, 300);
        }, 100);
    }
});

// ============================================
// Google Business Profile OAuth Functions
// ============================================

async function connectGoogleBusinessOAuth() {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        showToast('Please log in first', true);
        return;
    }

    try {
        const response = await fetch(`/api/auth/google-business/init?userId=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.authUrl) {
            // Open Google OAuth in a popup
            const width = 600;
            const height = 700;
            const left = (screen.width / 2) - (width / 2);
            const top = (screen.height / 2) - (height / 2);

            window.open(
                data.authUrl,
                'Google Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Listen for messages from the OAuth popup
            const messageHandler = (event) => {
                console.log('[OAuth Message] Received message:', event.data, 'from origin:', event.origin);

                // Verify origin for security
                if (event.origin !== window.location.origin) {
                    console.warn('[OAuth Message] Ignoring message from different origin');
                    return;
                }

                if (event.data && event.data.type === 'oauth_success' && event.data.platform === 'google') {
                    console.log('[OAuth Message] Google OAuth success detected, redirecting...');
                    window.removeEventListener('message', messageHandler);
                    showToast('✅ Google Business Profile connected successfully!');

                    // Reload the page and navigate to Google section with a flag to show location selector
                    setTimeout(() => {
                        window.location.href = '/admin.html?tab=marketing&platform=google&show_location_selector=true';
                    }, 500);
                } else if (event.data && event.data.type === 'oauth_error' && event.data.platform === 'google') {
                    console.log('[OAuth Message] Google OAuth error detected');
                    window.removeEventListener('message', messageHandler);
                    showToast(`❌ Failed to connect: ${event.data.error}`, true);
                }
            };

            console.log('[Google OAuth] Adding message listener');
            window.addEventListener('message', messageHandler);

            // Add direct function as backup for postMessage
            window.handleOAuthSuccess = function() {
                console.log('[Google OAuth] Direct function called by popup');
                window.removeEventListener('message', messageHandler);
                showToast('✅ Google Business Profile connected successfully!');
                setTimeout(() => {
                    window.location.href = '/admin.html?tab=marketing&platform=google&show_location_selector=true';
                }, 500);
            };

            // Also poll localStorage as a fallback
            const checkLocalStorage = setInterval(() => {
                const success = localStorage.getItem('google_oauth_success');
                if (success) {
                    console.log('[Google OAuth] Success detected via localStorage');
                    clearInterval(checkLocalStorage);
                    localStorage.removeItem('google_oauth_success');
                    window.removeEventListener('message', messageHandler);
                    showToast('✅ Google Business Profile connected successfully!');
                    setTimeout(() => {
                        window.location.href = '/admin.html?tab=marketing&platform=google&show_location_selector=true';
                    }, 500);
                }
            }, 500);

            // Clean up listener and polling after 5 minutes
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                clearInterval(checkLocalStorage);
                delete window.handleOAuthSuccess;
            }, 5 * 60 * 1000);

        } else {
            showToast(data.error || 'Failed to initiate Google Business Profile connection', true);
        }
    } catch (error) {
        console.error('Error connecting Google Business Profile:', error);
        showToast('Failed to connect Google Business Profile', true);
    }
}

async function disconnectGoogleBusiness() {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        showToast('Please log in first', true);
        return;
    }

    if (!confirm('Are you sure you want to disconnect your Google Business Profile?')) {
        return;
    }

    try {
        const response = await fetch(`/api/google-business/connection?userId=${user.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Google Business Profile disconnected');
            loadGoogleBusinessConnectionStatus();
        } else {
            showToast(data.error || 'Failed to disconnect', true);
        }
    } catch (error) {
        console.error('Error disconnecting Google Business Profile:', error);
        showToast('Failed to disconnect Google Business Profile', true);
    }
}

async function loadGoogleBusinessConnectionStatus() {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        return;
    }

    try {
        const response = await fetch(`/api/google-business/connection?userId=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.connected && data.connection) {
            // Show connected state
            document.getElementById('gbp-connected').style.display = 'block';
            document.getElementById('gbp-not-connected').style.display = 'none';

            // Update connection details
            const accountElement = document.getElementById('connected-gbp-account');
            const locationElement = document.getElementById('connected-gbp-location');

            accountElement.textContent = data.connection.accountName || 'Unknown Account';
            locationElement.textContent = data.connection.locationName || 'Unknown Location';

            // If account info is missing, show message instead of auto-fetching (to avoid rate limits)
            if (!data.connection.accountName || !data.connection.locationName) {
                console.log('[GBP] Account info missing - user can click Refresh button');
                accountElement.textContent = 'Click Refresh button >';
                locationElement.textContent = 'Click Refresh button >';

                // Show a helpful toast
                setTimeout(() => {
                    showToast('💡 Click the 🔄 Refresh button to load your business info', false);
                }, 1000);
            }

            // Don't auto-check locations to avoid rate limits
            // User can click "Change Location" button if they have multiple locations
            console.log('[GBP] Skipping auto-location check to avoid rate limits');
        } else {
            // Show not connected state
            document.getElementById('gbp-connected').style.display = 'none';
            document.getElementById('gbp-not-connected').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading GBP connection status:', error);
        // Default to not connected state
        document.getElementById('gbp-connected').style.display = 'none';
        document.getElementById('gbp-not-connected').style.display = 'block';
    }
}

async function testGoogleBusinessPost() {
    const token = localStorage.getItem('auth_token');
    const user = window.currentUser;

    if (!token || !user || !user.id) {
        showToast('Please log in first', true);
        return;
    }

    const btn = document.getElementById('test-gbp-btn');
    const status = document.getElementById('test-gbp-status');

    btn.disabled = true;
    btn.textContent = '📤 Sending...';
    status.textContent = 'Creating test post...';
    status.style.color = '#bc9c22';

    try {
        const response = await fetch('/api/google-business/test-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: user.id
            })
        });

        const data = await response.json();

        if (data.success) {
            status.textContent = '✅ Test post sent successfully! Check your Google Business Profile.';
            status.style.color = '#28a745';
            showToast('Test post sent to Google Business Profile!');
        } else {
            status.textContent = `❌ Error: ${data.error || 'Failed to send test post'}`;
            status.style.color = '#dc3545';
            showToast(data.error || 'Failed to send test post', true);
        }
    } catch (error) {
        console.error('Error sending test post:', error);
        status.textContent = '❌ Error: Network error or server unavailable';
        status.style.color = '#dc3545';
        showToast('Failed to send test post', true);
    } finally {
        btn.disabled = false;
        btn.textContent = '📤 Send Test Post to Google Business';
    }
}

// Automated Marketing tab navigation functions
function showMarketingPlatform(platform) {
    // Hide platform selector
    const selector = document.getElementById('marketing-platform-selector');
    if (selector) {
        selector.style.display = 'none';
    }

    // Hide both platform sections first
    const facebookSection = document.getElementById('marketing-facebook-section');
    const googleSection = document.getElementById('marketing-google-section');
    if (facebookSection) facebookSection.style.display = 'none';
    if (googleSection) googleSection.style.display = 'none';

    // Show the selected platform section
    if (platform === 'facebook' && facebookSection) {
        facebookSection.style.display = 'block';
    } else if (platform === 'google' && googleSection) {
        googleSection.style.display = 'block';
    }
}

function backToMarketingSelector() {
    // Show platform selector
    const selector = document.getElementById('marketing-platform-selector');
    if (selector) {
        selector.style.display = 'block';
    }

    // Hide both platform sections
    const facebookSection = document.getElementById('marketing-facebook-section');
    const googleSection = document.getElementById('marketing-google-section');
    if (facebookSection) facebookSection.style.display = 'none';
    if (googleSection) googleSection.style.display = 'none';
}

// Export new functions
window.connectFacebookOAuth = connectFacebookOAuth;
window.disconnectFacebook = disconnectFacebook;
window.loadFacebookConnectionStatus = loadFacebookConnectionStatus;
window.connectGoogleBusinessOAuth = connectGoogleBusinessOAuth;
window.disconnectGoogleBusiness = disconnectGoogleBusiness;
window.loadGoogleBusinessConnectionStatus = loadGoogleBusinessConnectionStatus;
window.testGoogleBusinessPost = testGoogleBusinessPost;
window.showMarketingPlatform = showMarketingPlatform;
window.backToMarketingSelector = backToMarketingSelector;

// Facebook Posting Schedule Functions
function toggleCustomSchedule() {
    const frequency = document.getElementById('postFrequency');
    const customSection = document.getElementById('customScheduleSection');

    if (frequency && customSection) {
        if (frequency.value === 'custom') {
            customSection.style.display = 'block';
        } else {
            customSection.style.display = 'none';
        }
    }
}

// Save Facebook schedule settings
async function saveFacebookSchedule() {
    try {
        const postFrequency = document.getElementById('postFrequency')?.value || 'immediate';

        // Get selected days
        const scheduleDays = [];
        document.querySelectorAll('.schedule-day:checked').forEach(checkbox => {
            scheduleDays.push(checkbox.value);
        });

        const schedStartTime = document.getElementById('schedStartTime')?.value || '09:00';
        const schedEndTime = document.getElementById('schedEndTime')?.value || '17:00';
        const maxPostsPerDay = document.getElementById('maxPostsPerDay')?.value || '1';

        const scheduleSettings = {
            postFrequency,
            scheduleDays,
            schedStartTime,
            schedEndTime,
            maxPostsPerDay
        };

        // Save to user settings
        const currentSettings = getSettings();
        const updatedSettings = {
            ...currentSettings,
            facebookSchedule: scheduleSettings
        };

        await saveSetting(STORAGE_KEYS.SETTINGS, updatedSettings);

        // Also save to database via API
        const token = localStorage.getItem('auth_token');
        if (token) {
            await fetch('/api/user/save-schedule-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ scheduleSettings })
            });
        }

        showToast('✅ Schedule settings saved successfully!');
        return true;
    } catch (error) {
        console.error('Error saving schedule settings:', error);
        showToast('❌ Error saving schedule settings', true);
        return false;
    }
}

// Load Facebook schedule settings
async function loadFacebookSchedule() {
    try {
        const settings = getSettings();
        const scheduleSettings = settings?.facebookSchedule || {};

        // Set frequency
        const postFrequency = document.getElementById('postFrequency');
        if (postFrequency) {
            postFrequency.value = scheduleSettings.postFrequency || 'immediate';
            toggleCustomSchedule(); // Show/hide custom section based on value
        }

        // Set selected days
        const scheduleDays = scheduleSettings.scheduleDays || [];
        document.querySelectorAll('.schedule-day').forEach(checkbox => {
            checkbox.checked = scheduleDays.includes(checkbox.value);
        });

        // Set time window
        const schedStartTime = document.getElementById('schedStartTime');
        if (schedStartTime) {
            schedStartTime.value = scheduleSettings.schedStartTime || '09:00';
        }

        const schedEndTime = document.getElementById('schedEndTime');
        if (schedEndTime) {
            schedEndTime.value = scheduleSettings.schedEndTime || '17:00';
        }

        // Set max posts per day
        const maxPostsPerDay = document.getElementById('maxPostsPerDay');
        if (maxPostsPerDay) {
            maxPostsPerDay.value = scheduleSettings.maxPostsPerDay || '1';
        }
    } catch (error) {
        console.error('Error loading schedule settings:', error);
    }
}

// Auto-save schedule settings when any field changes
function initScheduleAutoSave() {
    const postFrequency = document.getElementById('postFrequency');
    if (postFrequency) {
        postFrequency.addEventListener('change', saveFacebookSchedule);
    }

    document.querySelectorAll('.schedule-day').forEach(checkbox => {
        checkbox.addEventListener('change', saveFacebookSchedule);
    });

    const schedStartTime = document.getElementById('schedStartTime');
    if (schedStartTime) {
        schedStartTime.addEventListener('change', saveFacebookSchedule);
    }

    const schedEndTime = document.getElementById('schedEndTime');
    if (schedEndTime) {
        schedEndTime.addEventListener('change', saveFacebookSchedule);
    }

    const maxPostsPerDay = document.getElementById('maxPostsPerDay');
    if (maxPostsPerDay) {
        maxPostsPerDay.addEventListener('change', saveFacebookSchedule);
    }
}

window.toggleCustomSchedule = toggleCustomSchedule;
window.saveFacebookSchedule = saveFacebookSchedule;
window.loadFacebookSchedule = loadFacebookSchedule;
window.initScheduleAutoSave = initScheduleAutoSave;

// Simplified card layout - no expansion functionality needed
