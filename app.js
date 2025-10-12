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

        this.init();
    }

    init() {
        this.populateSizeFilter();
        this.attachEventListeners();
        this.renderBuildings();
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
        const repoBadge = building.isRepo ? '<div class="repo-badge">REPO</div>' : '';

        return `
            <div class="building-card" data-serial="${building.serialNumber}">
                <div class="building-image">
                    ${repoBadge}
                    <span>\u{1F3E0}</span>
                </div>
                <div class="building-info">
                    <div class="building-type">${building.typeName}</div>
                    <div class="building-title">${building.title}</div>
                    <div class="building-size">${building.sizeDisplay}</div>

                    <div class="building-details">
                        <div class="building-detail-item">
                            <span class="label">Cash Price:</span>
                            <span class="value">$${building.price.toLocaleString()}</span>
                        </div>
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
                        <div class="building-detail-item">
                            <span class="label">Location:</span>
                            <span class="value">${building.location}</span>
                        </div>
                        <div class="building-detail-item">
                            <span class="label">Status:</span>
                            <span class="value">${building.isRepo ? 'Repo' : 'Available'}</span>
                        </div>
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new InventoryApp();
    });
} else {
    window.app = new InventoryApp();
}
