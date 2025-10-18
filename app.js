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
            location: 'all',
            status: 'all'
        };

        this.elements = {
            typeFilter: document.getElementById('type-filter'),
            sizeFilter: document.getElementById('size-filter'),
            locationFilter: document.getElementById('location-filter'),
            statusFilter: document.getElementById('status-filter'),
            buildingsGrid: document.getElementById('buildings-grid'),
            countDisplay: document.getElementById('count')
        };

        // Load admin settings
        this.settings = this.loadSettings();
        this.buildingOverrides = this.loadBuildingOverrides();

        // Cache for building images
        this.imageCache = {};

        this.init();
    }

    loadSettings() {
        // For multi-tenant sites, use settings from SITE_CONFIG
        if (window.SITE_CONFIG && window.SITE_CONFIG.settings) {
            // Settings are stored with the key 'cpb_admin_settings'
            const adminSettings = window.SITE_CONFIG.settings.cpb_admin_settings || {};
            return {
                showCashPrice: adminSettings.showCashPrice !== false,
                showRtoOptions: adminSettings.showRtoOptions !== false,
                repoSortOrder: adminSettings.repoSortOrder || 'last',
                repoPriceDisplay: adminSettings.repoPriceDisplay || 'strikethrough'
            };
        }

        // For non-multi-tenant sites, use localStorage
        const stored = localStorage.getItem('cpb_admin_settings');
        return stored ? JSON.parse(stored) : {
            showCashPrice: true,
            showRtoOptions: true,
            repoSortOrder: 'last',
            repoPriceDisplay: 'strikethrough'
        };
    }

    /**
     * Calculate repo discount based on year built
     * 2024: 5% off
     * 2023: 10% off
     * 2022: 15% off
     * 2021 and older: 20% off
     */
    calculateRepoDiscount(building) {
        if (!building.isRepo || !building.dateBuiltObj) {
            return 0;
        }

        const yearBuilt = parseInt(building.dateBuiltObj.year);
        const currentYear = new Date().getFullYear();

        if (yearBuilt >= 2024) {
            return 0.05; // 5% off
        } else if (yearBuilt === 2023) {
            return 0.10; // 10% off
        } else if (yearBuilt === 2022) {
            return 0.15; // 15% off
        } else {
            return 0.20; // 20% off for 2021 and older
        }
    }

    calculateDiscountedPrice(building) {
        const discountRate = this.calculateRepoDiscount(building);
        const discountedPrice = building.price * (1 - discountRate);
        return Math.round(discountedPrice); // Round to nearest dollar
    }

    loadBuildingOverrides() {
        const stored = localStorage.getItem('cpb_building_overrides');
        return stored ? JSON.parse(stored) : {};
    }

    init() {
        console.log('[InventoryApp] Initializing with', this.inventory.length, 'buildings');

        // Only load from localStorage if we're not on a multi-tenant site (no SITE_CONFIG)
        if (!window.SITE_CONFIG) {
            this.loadBusinessInfo();
            this.loadBusinessHours();
            this.loadWelcomeMessage();
        }
        // site-loader.js already handled business info, hours, and welcome message for multi-tenant sites

        this.populateSizeFilter();
        this.populateLocationFilter();
        this.attachEventListeners();
        this.renderBuildings();
    }

    loadBusinessInfo() {
        // Only used for non-multi-tenant sites (when loaded directly)
        // Multi-tenant sites use site-loader.js which sets this from the database

        // Load business name
        const businessName = localStorage.getItem('cpb_business_name') || 'Community Portable Buildings';
        const headerEl = document.getElementById('business-name-header');
        if (headerEl) {
            headerEl.textContent = businessName;
        }

        const footerNameEl = document.getElementById('footer-business-name');
        if (footerNameEl) {
            footerNameEl.textContent = businessName;
        }

        const copyrightNameEl = document.getElementById('footer-copyright-name');
        if (copyrightNameEl) {
            copyrightNameEl.textContent = businessName;
        }

        // Load phone
        const businessPhone = localStorage.getItem('cpb_business_phone') || '318-594-5909';
        const headerPhoneLink = document.getElementById('header-phone-link');
        if (headerPhoneLink) {
            headerPhoneLink.href = `tel:${businessPhone}`;
            headerPhoneLink.textContent = businessPhone;
        }

        const footerPhoneLink = document.getElementById('footer-phone-link');
        if (footerPhoneLink) {
            footerPhoneLink.href = `tel:${businessPhone}`;
            footerPhoneLink.textContent = businessPhone;
        }

        // Load email
        const businessEmail = localStorage.getItem('cpb_business_email') || '';
        if (businessEmail) {
            const footerEmailContainer = document.getElementById('footer-email-container');
            const footerEmailLink = document.getElementById('footer-email-link');

            if (footerEmailContainer && footerEmailLink) {
                footerEmailContainer.style.display = 'block';
                footerEmailLink.href = `mailto:${businessEmail}`;
                footerEmailLink.textContent = businessEmail;
            }
        }

        // Load address
        const businessAddress = localStorage.getItem('cpb_business_address') || '';
        if (businessAddress) {
            const footerAddressEl = document.getElementById('footer-address');
            if (footerAddressEl) {
                // Replace line breaks with <br> tags for proper display
                footerAddressEl.innerHTML = businessAddress.replace(/\n/g, '<br>');
            }
        }

        // Load social media links
        this.loadSocialLinks();
    }

    loadSocialLinks() {
        // Only used for non-multi-tenant sites
        // Multi-tenant sites get social links from site-loader.js
        const saved = localStorage.getItem('cpb_social_media');
        const social = saved ? JSON.parse(saved) : {};
        const container = document.getElementById('social-links');

        if (!container) return;

        let linksHTML = '';

        if (social.facebook) {
            linksHTML += `
                <a href="${social.facebook}" target="_blank" rel="noopener noreferrer" class="social-link facebook" title="Facebook">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </a>
            `;
        }

        if (social.instagram) {
            linksHTML += `
                <a href="${social.instagram}" target="_blank" rel="noopener noreferrer" class="social-link instagram" title="Instagram">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                </a>
            `;
        }

        if (social.twitter) {
            linksHTML += `
                <a href="${social.twitter}" target="_blank" rel="noopener noreferrer" class="social-link twitter" title="Twitter/X">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                </a>
            `;
        }

        if (linksHTML) {
            container.innerHTML = linksHTML;
        } else {
            container.innerHTML = '<p style="opacity: 0.6; font-size: 0.9rem;">No social media links added yet</p>';
        }
    }

    loadBusinessHours() {
        // Only used for non-multi-tenant sites
        // Multi-tenant sites get hours from site-loader.js
        const saved = localStorage.getItem('cpb_location_hours');
        if (!saved) return;

        const hours = JSON.parse(saved);

        // Display in header - "Open Today from XX:XX til XX:XX"
        this.displayTodayHours(hours);

        // Display full hours in footer
        this.displayFooterHours(hours);
    }

    convertTo12Hour(time24) {
        // Convert 24-hour time (HH:MM) to 12-hour format with AM/PM
        const [hours, minutes] = time24.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'pm' : 'am';

        hour = hour % 12;
        hour = hour ? hour : 12; // Convert 0 to 12

        return `${hour}:${minutes} ${ampm}`;
    }

    displayTodayHours(hours) {
        const headerHoursText = document.getElementById('header-hours-text');
        if (!headerHoursText) return;

        // Get current day
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];

        // Check if hours exist for today
        if (hours[today] && hours[today].open && hours[today].close) {
            const todayHours = hours[today];
            const openTime = this.convertTo12Hour(todayHours.open);
            const closeTime = this.convertTo12Hour(todayHours.close);
            headerHoursText.textContent = `Open Today from ${openTime} til ${closeTime}`;
            headerHoursText.style.display = 'block';
        } else {
            headerHoursText.style.display = 'none';
        }
    }

    displayFooterHours(hours) {
        const footerHours = document.getElementById('footer-hours');
        if (!footerHours) return;

        const dayNames = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday'
        };

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        let hoursHTML = '';
        let hasHours = false;

        days.forEach(day => {
            if (hours[day] && hours[day].open && hours[day].close) {
                hasHours = true;
                const openTime = this.convertTo12Hour(hours[day].open);
                const closeTime = this.convertTo12Hour(hours[day].close);
                hoursHTML += `
                    <div class="hours-item">
                        <span class="hours-day">${dayNames[day]}:</span>
                        <span class="hours-time">${openTime} - ${closeTime}</span>
                    </div>
                `;
            }
        });

        if (hasHours) {
            footerHours.innerHTML = hoursHTML;
        } else {
            footerHours.innerHTML = '<p style="opacity: 0.6; font-size: 0.9rem;">Hours not set</p>';
        }
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
        // Clear existing options except "All Sizes"
        const sizeFilter = this.elements.sizeFilter;
        while (sizeFilter.options.length > 1) {
            sizeFilter.remove(1);
        }

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
            sizeFilter.appendChild(option);
        });
    }

    populateLocationFilter() {
        // Clear existing options except "All Locations"
        const locationFilter = this.elements.locationFilter;
        while (locationFilter.options.length > 1) {
            locationFilter.remove(1);
        }

        // Get unique locations from inventory
        const locations = [...new Set(this.inventory.map(item => item.location))];
        locations.sort();

        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
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

        this.elements.locationFilter.addEventListener('change', (e) => {
            this.filters.location = e.target.value;
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

            // Handle Cabin type - it can have typeCode 'CB' or 'C'
            let typeMatch;
            if (this.filters.type === 'all') {
                typeMatch = true;
            } else if (this.filters.type === 'CB') {
                // When Cabin filter is selected, match both 'CB' and 'C' type codes
                typeMatch = item.typeCode === 'CB' || item.typeCode === 'C';
            } else {
                typeMatch = item.typeCode === this.filters.type;
            }

            const sizeMatch = this.filters.size === 'all' || item.sizeDisplay === this.filters.size;
            const locationMatch = this.filters.location === 'all' || item.location === this.filters.location;
            const statusMatch = this.filters.status === 'all' ||
                (this.filters.status === 'repo' && item.isRepo) ||
                (this.filters.status === 'available' && !item.isRepo);

            return typeMatch && sizeMatch && locationMatch && statusMatch;
        });

        this.renderBuildings();
    }

    renderBuildings() {
        this.updateCount();

        if (this.filteredInventory.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Sort buildings based on repo sort order setting
        let sortedInventory = [...this.filteredInventory];
        if (this.settings.repoSortOrder === 'first') {
            // Repos first, then regular buildings
            sortedInventory.sort((a, b) => {
                if (a.isRepo && !b.isRepo) return -1;
                if (!a.isRepo && b.isRepo) return 1;
                return 0;
            });
        } else {
            // Regular buildings first, then repos (default)
            sortedInventory.sort((a, b) => {
                if (a.isRepo && !b.isRepo) return 1;
                if (!a.isRepo && b.isRepo) return -1;
                return 0;
            });
        }

        const html = sortedInventory.map(building => this.createBuildingCard(building)).join('');
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
            let priceDisplay;

            if (building.isRepo) {
                if (this.settings.repoPriceDisplay === 'discounted') {
                    // Show discounted price
                    const discountedPrice = this.calculateDiscountedPrice(building);
                    const discountPercent = Math.round(this.calculateRepoDiscount(building) * 100);
                    priceDisplay = `
                        <span class="value strikethrough">$${building.price.toLocaleString()}</span>
                        <span class="value" style="color: #28a745; font-weight: 700;">$${discountedPrice.toLocaleString()}</span>
                        <div class="repo-price-note" style="color: #28a745;">${discountPercent}% Pre-Owned Discount Applied!</div>
                    `;
                } else {
                    // Show strikethrough with CTA (default)
                    priceDisplay = `
                        <span class="value strikethrough">$${building.price.toLocaleString()}</span>
                        <div class="repo-price-note">Call for Pre-Owned Price</div>
                    `;
                }
            } else {
                priceDisplay = `<span class="value">$${building.price.toLocaleString()}</span>`;
            }

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
                        <span class="rto-price">$${parseFloat(building.rto36).toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-option">
                        <span class="rto-term">48 months:</span>
                        <span class="rto-price">$${parseFloat(building.rto48).toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-option">
                        <span class="rto-term">60 months:</span>
                        <span class="rto-price">$${parseFloat(building.rto60).toFixed(2)}/mo</span>
                    </div>
                    <div class="rto-option">
                        <span class="rto-term">72 months:</span>
                        <span class="rto-price">$${parseFloat(building.rto72).toFixed(2)}/mo</span>
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
                            <span class="label">Location:</span>
                            <span class="value">${building.location || 'GPB Sales'}</span>
                        </div>
                        <div class="building-detail-item">
                            <span class="label">Status:</span>
                            <span class="value">${building.isRepo ? 'Pre-Owned' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </div>
                    </div>

                    <button class="inquire-btn" onclick="openInquiryModal('${building.serialNumber}')">
                        Inquire About This Building
                    </button>

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
        // Return cached images if available
        if (this.imageCache[serialNumber]) {
            return this.imageCache[serialNumber];
        }

        // Load images async and update the card when ready
        this.loadBuildingImagesAsync(serialNumber);

        // Return empty array for now (will show emoji placeholder)
        return [];
    }

    async loadBuildingImagesAsync(serialNumber) {
        try {
            // Get userId from SITE_CONFIG if available (for dealer websites)
            const userId = window.SITE_CONFIG ? window.SITE_CONFIG.userId : null;
            const userIdParam = userId ? `&userId=${userId}` : '';

            // Get image order from localStorage (fallback for non-multi-tenant sites)
            const imageOrder = localStorage.getItem('cpb_image_order');
            const orderParam = imageOrder ? `&order=${encodeURIComponent(imageOrder)}` : '';

            const response = await fetch(`/api/images?serialNumber=${encodeURIComponent(serialNumber)}${userIdParam}${orderParam}`);
            const data = await response.json();

            if (data.success && data.images.length > 0) {
                // Cache the images
                this.imageCache[serialNumber] = data.images;

                // Update the specific card
                const card = document.querySelector(`[data-serial="${serialNumber}"]`);
                if (card) {
                    const imageContainer = card.querySelector('.building-image');
                    if (imageContainer) {
                        // Create gallery HTML
                        const galleryHTML = `
                            <div class="building-image-gallery">
                                ${data.images.map((img, index) => `
                                    <img src="${img}" alt="Building ${index + 1}"
                                         class="gallery-image ${index === 0 ? 'active' : ''}"
                                         data-index="${index}">
                                `).join('')}
                                ${data.images.length > 1 ? `
                                    <button class="gallery-nav prev" onclick="prevImage(event, '${serialNumber}')">❮</button>
                                    <button class="gallery-nav next" onclick="nextImage(event, '${serialNumber}')">❯</button>
                                    <div class="gallery-indicators">
                                        ${data.images.map((_, i) => `
                                            <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;

                        // Find and keep the repo badge if it exists
                        const repoBadge = imageContainer.querySelector('.repo-badge');
                        const badgeHTML = repoBadge ? repoBadge.outerHTML : '';

                        // Replace the emoji with the gallery
                        imageContainer.innerHTML = badgeHTML + galleryHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load images for', serialNumber, error);
        }
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

// Listen for inventory data ready event from site-loader.js
window.addEventListener('inventoryDataReady', () => {
    console.log('[InventoryApp] Inventory data ready event received');
    if (!window.app && window.PROCESSED_INVENTORY) {
        window.app = new InventoryApp();
    }
});

// App will be initialized by site-loader.js after data is loaded
// For backwards compatibility (non-multi-tenant sites), initialize if PROCESSED_INVENTORY exists
if (window.PROCESSED_INVENTORY && window.PROCESSED_INVENTORY.length > 0 && !window.app) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[InventoryApp] Initializing from DOMContentLoaded');
            window.app = new InventoryApp();
        });
    } else {
        console.log('[InventoryApp] Initializing immediately');
        window.app = new InventoryApp();
    }
}
