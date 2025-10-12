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
    LOTS: 'cpb_other_lots'
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

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadSettings();
    loadWelcomeMessage();
    loadCarousel();
    loadLots();
    loadBuildings();
    initializeBuildingFilters();
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
}

// Settings Management
function loadSettings() {
    const settings = getSettings();
    document.getElementById('showCashPrice').checked = settings.showCashPrice;
    document.getElementById('showRtoOptions').checked = settings.showRtoOptions;
}

function getSettings() {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
}

function saveSettings() {
    const settings = {
        showCashPrice: document.getElementById('showCashPrice').checked,
        showRtoOptions: document.getElementById('showRtoOptions').checked
    };

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    showToast('Settings saved successfully!');
}

// Welcome Message Management
function loadWelcomeMessage() {
    const welcome = getWelcomeMessage();
    document.getElementById('welcomeTitle').value = welcome.title;
    document.getElementById('welcomeMessage').value = welcome.message;
}

function getWelcomeMessage() {
    const stored = localStorage.getItem(STORAGE_KEYS.WELCOME);
    return stored ? JSON.parse(stored) : DEFAULT_WELCOME;
}

function saveWelcomeMessage() {
    const welcome = {
        title: document.getElementById('welcomeTitle').value,
        message: document.getElementById('welcomeMessage').value
    };

    localStorage.setItem(STORAGE_KEYS.WELCOME, JSON.stringify(welcome));
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
    const stored = localStorage.getItem(STORAGE_KEYS.CAROUSEL);
    return stored ? JSON.parse(stored) : DEFAULT_CAROUSEL;
}

function addCarouselImage() {
    const input = document.getElementById('newCarouselImage');
    const imageName = input.value.trim();

    if (!imageName) {
        showToast('Please enter an image filename', true);
        return;
    }

    const images = getCarouselImages();
    images.push(imageName);
    localStorage.setItem(STORAGE_KEYS.CAROUSEL, JSON.stringify(images));

    input.value = '';
    loadCarousel();
    showToast('Image added to carousel!');
}

function removeCarouselImage(index) {
    if (!confirm('Remove this image from the carousel?')) return;

    const images = getCarouselImages();
    images.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.CAROUSEL, JSON.stringify(images));

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

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem !== item) {
                const images = getCarouselImages();
                const draggedIndex = parseInt(draggedItem.dataset.index);
                const targetIndex = parseInt(item.dataset.index);

                // Swap images
                [images[draggedIndex], images[targetIndex]] = [images[targetIndex], images[draggedIndex]];

                localStorage.setItem(STORAGE_KEYS.CAROUSEL, JSON.stringify(images));
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

// Buildings Management
function loadBuildings() {
    const inventory = window.PROCESSED_INVENTORY || [];
    const overrides = getBuildingOverrides();
    const container = document.getElementById('buildings-list');

    if (inventory.length === 0) {
        container.innerHTML = '<p>No buildings found in inventory. Make sure inventory.js is loaded.</p>';
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

        return `
            <div class="building-item">
                <div class="building-info-admin">
                    <h3>
                        ${building.title} - ${building.sizeDisplay}
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
    const stored = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    return stored ? JSON.parse(stored) : {};
}

function setBuildingStatus(serialNumber, status) {
    const overrides = getBuildingOverrides();

    if (!overrides[serialNumber]) {
        overrides[serialNumber] = {};
    }

    overrides[serialNumber].status = status;

    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(overrides));
    loadBuildings();
    showToast(`Building status updated to ${status}!`);
}

function toggleBuildingVisibility(serialNumber) {
    const overrides = getBuildingOverrides();

    if (!overrides[serialNumber]) {
        overrides[serialNumber] = {};
    }

    overrides[serialNumber].hidden = !overrides[serialNumber].hidden;

    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(overrides));
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

        // Check if there's a custom order stored
        const orderKey = `cpb_image_order_${serialNumber}`;
        let orderedImages = JSON.parse(localStorage.getItem(orderKey) || 'null');

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
            // Update stored order
            localStorage.setItem(orderKey, JSON.stringify(orderedImages));
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

        // Check for custom order
        const orderKey = `cpb_image_order_${serialNumber}`;
        let orderedImages = JSON.parse(localStorage.getItem(orderKey) || 'null');

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

        // Save the new order by storing it in localStorage
        // (Vercel Blob doesn't support reordering, so we store order separately)
        const orderKey = `cpb_image_order_${currentBuilding}`;
        localStorage.setItem(orderKey, JSON.stringify(images));

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
                    const orderKey = `cpb_image_order_${currentBuilding}`;
                    let images = JSON.parse(localStorage.getItem(orderKey) || 'null') || data.images;

                    // Remove dragged image and insert at target position
                    const draggedIndex = images.indexOf(draggedUrl);
                    images.splice(draggedIndex, 1);
                    images.splice(targetIndex, 0, draggedUrl);

                    // Save new order
                    localStorage.setItem(orderKey, JSON.stringify(images));

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
function loadLots() {
    const lots = getLots();
    const container = document.getElementById('lots-list');

    if (!lots || lots.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--text-light);">No other lots added yet. Add one below to start syncing inventory.</p>';
        return;
    }

    container.innerHTML = lots.map((lot, index) => {
        const syncStatus = lot.lastSync ?
            `Last synced: ${new Date(lot.lastSync).toLocaleString()}` :
            'Will sync automatically during next scheduled sync';

        return `
            <div class="lot-item">
                <div class="lot-info">
                    <h3>
                        ${lot.name}
                        <span class="lot-badge">${lot.buildingCount || 0} buildings</span>
                    </h3>
                    <p class="sync-status">${syncStatus}</p>
                </div>
                <div class="lot-actions">
                    <button class="btn btn-sm btn-danger" onclick="removeLot(${index})">Remove</button>
                </div>
            </div>
        `;
    }).join('');
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

// Export functions to global scope
window.saveSettings = saveSettings;
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
