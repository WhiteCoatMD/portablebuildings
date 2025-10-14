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
    CUSTOM_COLORS: 'cpb_custom_colors',
    STRIPE_ENABLED: 'cpb_stripe_enabled',
    STRIPE_PUBLISHABLE_KEY: 'cpb_stripe_publishable_key',
    STRIPE_SECRET_KEY: 'cpb_stripe_secret_key',
    STRIPE_ACCEPT_DEPOSITS: 'cpb_stripe_accept_deposits',
    STRIPE_ACCEPT_FULL: 'cpb_stripe_accept_full',
    STRIPE_DEPOSIT_TYPE: 'cpb_stripe_deposit_type',
    STRIPE_DEPOSIT_FIXED: 'cpb_stripe_deposit_fixed',
    STRIPE_DEPOSIT_PERCENT: 'cpb_stripe_deposit_percent',
    STRIPE_SUCCESS_MESSAGE: 'cpb_stripe_success_message'
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
    loadStripeSettings();
    loadFacebookConfig();
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

// Settings Management
function loadSettings() {
    const settings = getSettings();
    document.getElementById('showCashPrice').checked = settings.showCashPrice;
    document.getElementById('showRtoOptions').checked = settings.showRtoOptions;
}

function getSettings() {
    return getSetting(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

async function saveSettings() {
    const settings = {
        showCashPrice: document.getElementById('showCashPrice').checked,
        showRtoOptions: document.getElementById('showRtoOptions').checked
    };

    await saveSetting(STORAGE_KEYS.SETTINGS, settings);
    showToast('Settings saved successfully!');
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
        const response = await fetch(`/api/images?serialNumber=${encodeURIComponent(serialNumber)}`);
        const data = await response.json();

        if (!data.success || !data.images.length) {
            return [];
        }

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
    const btn = document.getElementById('test-fb-btn');
    const status = document.getElementById('test-fb-status');

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
                document.getElementById('customBgColor').value = settings.color;
                document.getElementById('customBgColorHex').value = settings.color;
            } else {
                document.getElementById('gradientColor1').value = settings.color1;
                document.getElementById('gradientColor1Hex').value = settings.color1;
                document.getElementById('gradientColor2').value = settings.color2;
                document.getElementById('gradientColor2Hex').value = settings.color2;
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
    if (user.custom_domain && user.domain_verified) {
        document.getElementById('custom-domain-display').style.display = 'block';
        document.getElementById('custom-domain-form').style.display = 'none';
        document.getElementById('current-custom-domain').textContent = user.custom_domain;
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

            // Show DNS instructions
            const user = window.currentUser;
            const subdomainValueEl = document.getElementById('dns-subdomain-value');
            if (subdomainValueEl) {
                subdomainValueEl.textContent = `${user.subdomain}.shed-sync.com`;
            }
            document.getElementById('dns-instructions').style.display = 'block';

            // Update user object
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

            // Hide custom domain display, show form
            document.getElementById('custom-domain-display').style.display = 'none';
            document.getElementById('custom-domain-form').style.display = 'block';
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

// Stripe Payment Settings
async function loadStripeSettings() {
    try {
        // Load Stripe settings
        const enabledSetting = await loadSetting(STORAGE_KEYS.STRIPE_ENABLED);
        const publishableKeySetting = await loadSetting(STORAGE_KEYS.STRIPE_PUBLISHABLE_KEY);
        const depositsSetting = await loadSetting(STORAGE_KEYS.STRIPE_ACCEPT_DEPOSITS);
        const fullPaymentsSetting = await loadSetting(STORAGE_KEYS.STRIPE_ACCEPT_FULL);
        const depositTypeSetting = await loadSetting(STORAGE_KEYS.STRIPE_DEPOSIT_TYPE);
        const depositFixedSetting = await loadSetting(STORAGE_KEYS.STRIPE_DEPOSIT_FIXED);
        const depositPercentSetting = await loadSetting(STORAGE_KEYS.STRIPE_DEPOSIT_PERCENT);
        const successMessageSetting = await loadSetting(STORAGE_KEYS.STRIPE_SUCCESS_MESSAGE);

        // Set form values
        document.getElementById('enableStripePayments').checked = enabledSetting || false;
        document.getElementById('stripePublishableKey').value = publishableKeySetting || '';
        // Secret key is not loaded for security (one-way save only)
        document.getElementById('acceptDeposits').checked = depositsSetting !== false;
        document.getElementById('acceptFullPayments').checked = fullPaymentsSetting !== false;

        const depositType = depositTypeSetting || 'fixed';
        document.getElementById('depositTypeFixed').checked = depositType === 'fixed';
        document.getElementById('depositTypePercent').checked = depositType === 'percent';
        document.getElementById('depositFixed').value = depositFixedSetting || 500;
        document.getElementById('depositPercent').value = depositPercentSetting || 10;
        document.getElementById('paymentSuccessMessage').value = successMessageSetting ||
            'Thank you for your payment! We\'ll contact you shortly to arrange delivery and finalize details. A receipt has been sent to your email.';

    } catch (error) {
        console.error('Error loading Stripe settings:', error);
    }
}

async function saveStripeSettings() {
    try {
        const enabled = document.getElementById('enableStripePayments').checked;
        const publishableKey = document.getElementById('stripePublishableKey').value.trim();
        const secretKey = document.getElementById('stripeSecretKey').value.trim();
        const acceptDeposits = document.getElementById('acceptDeposits').checked;
        const acceptFullPayments = document.getElementById('acceptFullPayments').checked;
        const depositType = document.querySelector('input[name="depositType"]:checked').value;
        const depositFixed = parseInt(document.getElementById('depositFixed').value);
        const depositPercent = parseInt(document.getElementById('depositPercent').value);
        const successMessage = document.getElementById('paymentSuccessMessage').value.trim();

        // Validate keys if Stripe is enabled
        if (enabled) {
            if (!publishableKey || !publishableKey.startsWith('pk_')) {
                showToast('Please enter a valid Stripe publishable key (starts with pk_)', true);
                return;
            }

            // Only validate secret key if it's being updated (not empty)
            if (secretKey && !secretKey.startsWith('sk_')) {
                showToast('Please enter a valid Stripe secret key (starts with sk_)', true);
                return;
            }

            if (!secretKey) {
                // Check if secret key was saved before
                const existingSecret = await loadSetting(STORAGE_KEYS.STRIPE_SECRET_KEY);
                if (!existingSecret) {
                    showToast('Please enter your Stripe secret key', true);
                    return;
                }
            }
        }

        // Save all settings
        await saveSetting(STORAGE_KEYS.STRIPE_ENABLED, enabled);
        await saveSetting(STORAGE_KEYS.STRIPE_PUBLISHABLE_KEY, publishableKey);

        // Only save secret key if it's provided (allows updating other settings without re-entering secret)
        if (secretKey) {
            await saveSetting(STORAGE_KEYS.STRIPE_SECRET_KEY, secretKey);
        }

        await saveSetting(STORAGE_KEYS.STRIPE_ACCEPT_DEPOSITS, acceptDeposits);
        await saveSetting(STORAGE_KEYS.STRIPE_ACCEPT_FULL, acceptFullPayments);
        await saveSetting(STORAGE_KEYS.STRIPE_DEPOSIT_TYPE, depositType);
        await saveSetting(STORAGE_KEYS.STRIPE_DEPOSIT_FIXED, depositFixed);
        await saveSetting(STORAGE_KEYS.STRIPE_DEPOSIT_PERCENT, depositPercent);
        await saveSetting(STORAGE_KEYS.STRIPE_SUCCESS_MESSAGE, successMessage);

        showToast('Stripe settings saved successfully!');

        // Clear the secret key field after saving for security
        document.getElementById('stripeSecretKey').value = '';

    } catch (error) {
        console.error('Error saving Stripe settings:', error);
        showToast('Failed to save Stripe settings', true);
    }
}

async function testStripeConnection() {
    const btn = document.getElementById('test-stripe-btn');
    const statusEl = document.getElementById('stripe-status');

    try {
        btn.disabled = true;
        btn.textContent = '🔄 Testing...';
        statusEl.textContent = 'Testing connection to Stripe...';
        statusEl.style.color = '#2196f3';

        const publishableKey = document.getElementById('stripePublishableKey').value.trim();
        const secretKey = document.getElementById('stripeSecretKey').value.trim();

        if (!publishableKey || !secretKey) {
            // Try to get from saved settings
            const savedSecret = await loadSetting(STORAGE_KEYS.STRIPE_SECRET_KEY);

            if (!publishableKey || !savedSecret) {
                showToast('Please enter both Stripe keys first', true);
                statusEl.textContent = '❌ Missing API keys';
                statusEl.style.color = '#f44336';
                btn.disabled = false;
                btn.textContent = '🧪 Test Connection';
                return;
            }
        }

        const response = await fetch('/api/payments/test-stripe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                publishableKey,
                secretKey: secretKey || undefined
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('✓ Stripe connection successful!');
            statusEl.textContent = `✓ Connected to Stripe (${result.mode} mode)`;
            statusEl.style.color = '#4caf50';
        } else {
            showToast('Stripe connection failed: ' + result.error, true);
            statusEl.textContent = '❌ Connection failed: ' + result.error;
            statusEl.style.color = '#f44336';
        }

    } catch (error) {
        console.error('Test Stripe error:', error);
        showToast('Failed to test Stripe connection', true);
        statusEl.textContent = '❌ Connection test failed';
        statusEl.style.color = '#f44336';
    } finally {
        btn.disabled = false;
        btn.textContent = '🧪 Test Connection';
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
window.toggleDayHours = toggleDayHours;
window.syncUserInventory = syncUserInventory;
window.showSyncModal = showSyncModal;
window.uploadInventoryCSV = uploadInventoryCSV;
window.showCSVUpload = showCSVUpload;
window.viewLiveSite = viewLiveSite;
window.copySubdomainUrl = copySubdomainUrl;
window.saveCustomDomain = saveCustomDomain;
window.removeCustomDomain = removeCustomDomain;
window.copyDnsValue = copyDnsValue;
window.saveStripeSettings = saveStripeSettings;
window.testStripeConnection = testStripeConnection;
window.checkSubdomainAvailability = checkSubdomainAvailability;
window.saveSubdomain = saveSubdomain;
