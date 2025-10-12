/**
 * Main Application Logic
 * Handles filtering, display, and interaction
 */

class InventoryApp {
    constructor() {
        this.inventory = window.PROCESSED_INVENTORY || [];
        this.filteredInventory = [...this.inventory];
        this.filters = {
            type: 'all',
            size: 'all',
            status: 'all'
        };

        this.elements = {
            typeFilter: document.getElementById('type-filter'),
            sizeFilter: document.getElementById('size-filter'),
            statusFilter: document.getElementById('status-filter'),
            buildingsGrid: document.getElementById('buildings-grid'),
            countDisplay: document.getElementById('count')
        };

        // Load admin settings
        this.settings = this.loadSettings();
        this.buildingOverrides = this.loadBuildingOverrides();

        this.init();
    }

    loadSettings() {
        const stored = localStorage.getItem('cpb_admin_settings');
        return stored ? JSON.parse(stored) : { showCashPrice: true, showRtoOptions: true };
    }

    loadBuildingOverrides() {
        const stored = localStorage.getItem('cpb_building_overrides');
        return stored ? JSON.parse(stored) : {};
    }

    init() {
        this.loadWelcomeMessage();
        this.populateSizeFilter();
        this.attachEventListeners();
        this.renderBuildings();
    }

    loadWelcomeMessage() {
        const stored = localStorage.getItem('cpb_welcome_message');
        if (stored) {
            const welcome = JSON.parse(stored);
            const titleEl = document.querySelector('.welcome-message h2');
            const messageEl = document.querySelector('.welcome-message p');
            if (titleEl) titleEl.textContent = welcome.title;
            if (messageEl) messageEl.textContent = welcome.message;
        }
    }

    populateSizeFilter() {
        // Get unique sizes from inventory
        const sizes = [...new Set(this.inventory.map(item => item.sizeDisplay))];
        sizes.sort((a, b) => {
            const [aW, aL] = a.split('x').map(s => parseInt(s));
            const [bW, bL] = b.split('x').map(s => parseInt(s));
            return (aW * aL) - (bW * bL);
        });

        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            this.elements.sizeFilter.appendChild(option);
        });
    }

    attachEventListeners() {
        this.elements.typeFilter.addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });

        this.elements.sizeFilter.addEventListener('change', (e) => {
            this.filters.size = e.target.value;
            this.applyFilters();
        });

        this.elements.statusFilter.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });
    }

    applyFilters() {
        this.filteredInventory = this.inventory.filter(item => {
            // Check if building is hidden
            const override = this.buildingOverrides[item.serialNumber];
            if (override && override.hidden) return false;

            const typeMatch = this.filters.type === 'all' || item.typeCode === this.filters.type;
            const sizeMatch = this.filters.size === 'all' || item.sizeDisplay === this.filters.size;
            const statusMatch = this.filters.status === 'all' ||
                (this.filters.status === 'repo' && item.isRepo) ||
                (this.filters.status === 'available' && !item.isRepo);

            return typeMatch && sizeMatch && statusMatch;
        });

        this.renderBuildings();
    }

    renderBuildings() {
        this.updateCount();

        if (this.filteredInventory.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = this.filteredInventory.map(building => this.createBuildingCard(building)).join('');
        this.elements.buildingsGrid.innerHTML = html;
    }

    createBuildingCard(building) {
        // Prioritize auto-tracked status from scraper, then admin override
        const adminOverride = this.buildingOverrides[building.serialNumber] || {};
        const autoStatus = building.autoStatus || 'available';

        // Admin can override auto-status, but auto-status takes precedence for pending/sold
        let status = autoStatus;
        if (adminOverride.status && autoStatus === 'available') {
            // Only allow admin override if auto-tracker says available
            status = adminOverride.status;
        }

        // Status banner
        let statusBanner = '';
        if (status === 'pending') {
            statusBanner = '<div class="status-banner pending">Pending Sale</div>';
        } else if (status === 'sold') {
            statusBanner = '<div class="status-banner sold">Sold</div>';
        }

        const repoBadge = building.isRepo ? '<div class="repo-badge">REPO</div>' : '';

        // Get uploaded images
        const buildingImages = this.getBuildingImages(building.serialNumber);
        const hasImages = buildingImages && buildingImages.length > 0;

        // Image display - either uploaded photos or emoji
        let imageDisplay = '';
        if (hasImages) {
            imageDisplay = `
                <div class="building-image-gallery">
                    ${buildingImages.map((img, index) => `
                        <img src="${img}" alt="${building.title} ${index + 1}"
                             class="gallery-image ${index === 0 ? 'active' : ''}"
                             data-index="${index}">
                    `).join('')}
                    ${buildingImages.length > 1 ? `
                        <button class="gallery-nav prev" onclick="prevImage(event, '${building.serialNumber}')">❮</button>
                        <button class="gallery-nav next" onclick="nextImage(event, '${building.serialNumber}')">❯</button>
                        <div class="gallery-indicators">
                            ${buildingImages.map((_, i) => `
                                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            imageDisplay = '<span>🏠</span>';
        }

        // Price display based on settings
        let priceSection = '';
        if (this.settings.showCashPrice) {
            const priceDisplay = building.isRepo ?
                `<span class="value strikethrough">$${building.price.toLocaleString()}</span>
                 <div class="repo-price-note">Call for Pre-Owned Price</div>` :
                `<span class="value">$${building.price.toLocaleString()}</span>`;

            priceSection = `
                <div class="building-detail-item">
                    <span class="label">Cash Price:</span>
                    ${priceDisplay}
                </div>
            `;
        }

        // RTO section based on settings
        let rtoSection = '';
        if (this.settings.showRtoOptions && !building.isRepo) {
            rtoSection = `
                <button class="rto-button" onclick="toggleRTO(event, '${building.serialNumber}')">
                    Rent to Own Options
                </button>
                <div class="rto-tooltip" id="rto-${building.serialNumber.replace(/[^a-zA-Z0-9]/g, '')}">
                    ${building.rto36 ? `
                    <div class="rto-option">
                        <span class="rto-term">36 months:</span>
                        <span class="rto-price">$${building.rto36.toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-option">
                        <span class="rto-term">48 months:</span>
                        <span class="rto-price">$${building.rto48.toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-option">
                        <span class="rto-term">60 months:</span>
                        <span class="rto-price">$${building.rto60.toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-option">
                        <span class="rto-term">72 months:</span>
                        <span class="rto-price">$${building.rto72.toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-note">*Plus your local sales tax</div>
                    ` : `<div class="rto-note">RTO pricing not available</div>`}
                </div>
            `;
        }

        return `
            <div class="building-card" data-serial="${building.serialNumber}">
                ${statusBanner}
                <div class="building-image">
                    ${repoBadge}
                    ${imageDisplay}
                </div>
                <div class="building-info">
                    <div class="building-type">${building.typeName}</div>
                    <div class="building-title">${building.title}</div>
                    <div class="building-size">${building.sizeDisplay}</div>

                    <div class="building-details">
                        ${priceSection}
                        ${rtoSection}
                        <div class="building-detail-item">
                            <span class="label">Status:</span>
                            <span class="value">${building.isRepo ? 'Pre-Owned' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </div>
                    </div>

                    <div class="share-buttons">
                        <button class="share-btn" onclick="shareBuilding(event, 'facebook', '${building.serialNumber}')" title="Share on Facebook">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </button>
                        <button class="share-btn" onclick="shareBuilding(event, 'email', '${building.serialNumber}')" title="Share via Email">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                        </button>
                        <button class="share-btn" onclick="shareBuilding(event, 'sms', '${building.serialNumber}')" title="Share via Text">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="building-serial">
                        SN: ${building.serialNumber}
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        this.elements.buildingsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">\u{1F50D}</div>
                <h3>No buildings found</h3>
                <p>Try adjusting your filters to see more results.</p>
            </div>
        `;
    }

    updateCount() {
        this.elements.countDisplay.textContent = this.filteredInventory.length;
    }

    getBuildingImages(serialNumber) {
        const key = `cpb_images_${serialNumber}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }
}

// Toggle RTO tooltip
function toggleRTO(event, serialNumber) {
    event.stopPropagation();
    const cleanSerial = serialNumber.replace(/[^a-zA-Z0-9]/g, '');
    const tooltip = document.getElementById(`rto-${cleanSerial}`);

    // Close all other tooltips
    document.querySelectorAll('.rto-tooltip.active').forEach(t => {
        if (t.id !== `rto-${cleanSerial}`) {
            t.classList.remove('active');
        }
    });

    // Toggle this tooltip
    tooltip.classList.toggle('active');
}

// Close tooltip when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.rto-button') && !event.target.closest('.rto-tooltip')) {
        document.querySelectorAll('.rto-tooltip.active').forEach(t => {
            t.classList.remove('active');
        });
    }
});

// Hero Gallery Functionality
let currentSlideIndex = 0;
let slideInterval;

function showSlide(index) {
    const slides = document.querySelectorAll('.gallery-slide');
    const dots = document.querySelectorAll('.dot');

    if (!slides.length) return;

    // Wrap around
    if (index >= slides.length) currentSlideIndex = 0;
    else if (index < 0) currentSlideIndex = slides.length - 1;
    else currentSlideIndex = index;

    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Show current slide
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}

function changeSlide(direction) {
    showSlide(currentSlideIndex + direction);
    resetSlideInterval();
}

function currentSlide(index) {
    showSlide(index);
    resetSlideInterval();
}

function autoSlide() {
    showSlide(currentSlideIndex + 1);
}

function resetSlideInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(autoSlide, 5000);
}

// Start auto-sliding when page loads
document.addEventListener('DOMContentLoaded', () => {
    slideInterval = setInterval(autoSlide, 5000);
});

// Share building functionality
function shareBuilding(event, platform, serialNumber) {
    event.stopPropagation();

    // Find the building data
    const building = window.PROCESSED_INVENTORY.find(b => b.serialNumber === serialNumber);
    if (!building) return;

    const url = window.location.href;
    const price = building.isRepo ? 'Call for Pre-Owned Price' : `$${building.price.toLocaleString()}`;
    const title = `${building.typeName} - ${building.sizeDisplay}`;
    const message = `Check out this ${building.typeName} (${building.sizeDisplay}) at Community Portable Buildings!\n${price}\nLocation: ${building.location}\nSN: ${building.serialNumber}`;

    switch (platform) {
        case 'facebook':
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
            window.open(fbUrl, '_blank', 'width=600,height=400');
            break;

        case 'email':
            const emailSubject = encodeURIComponent(`${title} - Community Portable Buildings`);
            const emailBody = encodeURIComponent(`${message}\n\nView online: ${url}\n\nCall us at 318-594-5909 for more information!`);
            window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
            break;

        case 'sms':
            const smsBody = encodeURIComponent(`${message}\n\n${url}\n\nCommunity Portable Buildings - 318-594-5909`);
            window.location.href = `sms:?&body=${smsBody}`;
            break;
    }
}

// Building Image Gallery Navigation
function prevImage(event, serialNumber) {
    event.stopPropagation();
    navigateGallery(serialNumber, -1);
}

function nextImage(event, serialNumber) {
    event.stopPropagation();
    navigateGallery(serialNumber, 1);
}

function navigateGallery(serialNumber, direction) {
    const card = document.querySelector(`[data-serial="${serialNumber}"]`);
    if (!card) return;

    const images = card.querySelectorAll('.gallery-image');
    const indicators = card.querySelectorAll('.indicator');

    let currentIndex = 0;
    images.forEach((img, i) => {
        if (img.classList.contains('active')) {
            currentIndex = i;
        }
    });

    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    // Update active states
    images.forEach((img, i) => {
        img.classList.toggle('active', i === newIndex);
    });
    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === newIndex);
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new InventoryApp();
    });
} else {
    window.app = new InventoryApp();
}
