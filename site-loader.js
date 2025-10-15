/**
 * Site Loader - Multi-Tenant Dynamic Site
 * Loads site configuration based on the current domain
 */

// Global site configuration
window.SITE_CONFIG = null;
window.PROCESSED_INVENTORY = [];

// Load site configuration on page load
(async function loadSiteConfig() {
    try {
        console.log('[Site Loader] Loading site configuration...');

        // Get current domain
        const domain = window.location.hostname;

        // Fetch site configuration
        const response = await fetch(`/api/site/get-by-domain?domain=${encodeURIComponent(domain)}`);
        const data = await response.json();

        if (!data.success) {
            // If this is the main site, redirect to the SaaS landing page
            if (data.isMainSite) {
                console.log('[Site Loader] Main site detected, using default configuration');
                // Let the page load normally with defaults
                return;
            }

            console.error('[Site Loader] Site not found:', data.error);
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
                    <h1 style="color: #e74c3c;">Site Not Found</h1>
                    <p>The site you're looking for doesn't exist or hasn't been set up yet.</p>
                    <p style="color: #7f8c8d; font-size: 0.9rem;">Domain: ${domain}</p>
                </div>
            `;
            return;
        }

        // Store configuration globally
        window.SITE_CONFIG = data.site;
        window.PROCESSED_INVENTORY = data.site.inventory;

        console.log('[Site Loader] Site configuration loaded:', window.SITE_CONFIG.businessName);
        console.log('[Site Loader] Inventory loaded:', window.PROCESSED_INVENTORY.length, 'buildings');

        // Apply site configuration to page
        applySiteConfiguration();

        // Trigger app initialization after data is loaded
        if (window.app) {
            // App already exists, reload it with new data
            window.app.inventory = window.PROCESSED_INVENTORY;
            window.app.filteredInventory = [...window.PROCESSED_INVENTORY];
            window.app.populateSizeFilter();
            window.app.populateLocationFilter();
            window.app.renderBuildings();
        } else {
            // Create the app now that data is loaded
            window.app = new InventoryApp();
        }

    } catch (error) {
        console.error('[Site Loader] Failed to load site configuration:', error);
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
                <h1 style="color: #e74c3c;">Error Loading Site</h1>
                <p>There was a problem loading this site. Please try again later.</p>
                <p style="color: #7f8c8d; font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
    }
})();

function applySiteConfiguration() {
    const config = window.SITE_CONFIG;
    if (!config) return;

    // Use placeholder text if businessName is not set
    const displayName = config.businessName || '[Your Business Name]';

    // Update page title
    document.title = `${displayName} - Current Inventory`;

    // Update business name in header
    const businessNameHeader = document.getElementById('business-name-header');
    if (businessNameHeader) {
        businessNameHeader.textContent = displayName;
    }

    // Update phone number
    const phone = config.phone || '(555) 123-4567';
    const headerPhoneLink = document.getElementById('header-phone-link');
    if (headerPhoneLink) {
        headerPhoneLink.textContent = phone;
        headerPhoneLink.href = `tel:${phone}`;
    }

    // Update footer business name
    const footerBusinessName = document.getElementById('footer-business-name');
    if (footerBusinessName) {
        footerBusinessName.textContent = displayName;
    }

    // Update footer copyright
    const footerCopyrightName = document.getElementById('footer-copyright-name');
    if (footerCopyrightName) {
        footerCopyrightName.textContent = displayName;
    }

    // Update footer phone
    const footerPhoneLink = document.getElementById('footer-phone-link');
    if (footerPhoneLink) {
        footerPhoneLink.textContent = phone;
        footerPhoneLink.href = `tel:${phone}`;
    }

    // Update footer address
    if (config.address) {
        const footerAddress = document.getElementById('footer-address');
        if (footerAddress) {
            footerAddress.textContent = config.address;
        }
    }

    // Update footer email
    const email = config.bestContactEmail || config.email;
    if (email) {
        const footerEmailContainer = document.getElementById('footer-email-container');
        const footerEmailLink = document.getElementById('footer-email-link');
        if (footerEmailContainer && footerEmailLink) {
            footerEmailLink.textContent = email;
            footerEmailLink.href = `mailto:${email}`;
            footerEmailContainer.style.display = 'block';
        }
    }

    // Apply settings from database
    applyCustomizationSettings(config.settings);

    // Update location hours
    if (config.locationHours) {
        updateLocationHours(config.locationHours);
    }

    console.log('[Site Loader] Site configuration applied successfully');
}

function applyCustomizationSettings(settings) {
    if (!settings) return;

    // Apply color scheme
    if (settings.cpb_color_scheme) {
        const scheme = settings.cpb_color_scheme;
        if (scheme !== 'rustic-earth') {
            document.documentElement.setAttribute('data-color-scheme', scheme);
        }
    }

    // Apply custom button color
    if (settings.cpb_button_color) {
        document.documentElement.setAttribute('data-custom-button-color', '');
        document.documentElement.style.setProperty('--custom-button-color', settings.cpb_button_color);
    }

    // Apply welcome message
    if (settings.cpb_welcome_message) {
        const welcomeSection = document.querySelector('.welcome-message h2');
        const welcomeText = document.querySelector('.welcome-message p');

        if (welcomeSection && settings.cpb_welcome_message.title) {
            welcomeSection.textContent = settings.cpb_welcome_message.title;
        }
        if (welcomeText && settings.cpb_welcome_message.message) {
            welcomeText.textContent = settings.cpb_welcome_message.message;
        }
    }

    // Apply carousel images
    if (settings.cpb_carousel_images && settings.cpb_carousel_images.length > 0) {
        updateCarouselImages(settings.cpb_carousel_images);
    }

    // Apply social media links
    if (settings.cpb_social_media) {
        updateSocialLinks(settings.cpb_social_media);
    }
}

function updateCarouselImages(images) {
    const heroGallery = document.querySelector('.hero-gallery');
    const galleryDots = document.querySelector('.gallery-dots');

    if (!heroGallery || !images.length) return;

    // Clear existing slides
    heroGallery.innerHTML = '';
    if (galleryDots) galleryDots.innerHTML = '';

    // Add new slides
    images.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = `gallery-slide${index === 0 ? ' active' : ''}`;
        slide.innerHTML = `<img src="${image}" alt="Building ${index + 1}">`;
        heroGallery.appendChild(slide);

        if (galleryDots) {
            const dot = document.createElement('span');
            dot.className = `dot${index === 0 ? ' active' : ''}`;
            dot.onclick = () => currentSlide(index);
            galleryDots.appendChild(dot);
        }
    });
}

function updateSocialLinks(social) {
    const socialLinksContainer = document.getElementById('social-links');
    if (!socialLinksContainer) return;

    socialLinksContainer.innerHTML = '';

    if (social.facebook) {
        socialLinksContainer.innerHTML += `<a href="${social.facebook}" target="_blank" class="social-link">Facebook</a>`;
    }
    if (social.instagram) {
        socialLinksContainer.innerHTML += `<a href="${social.instagram}" target="_blank" class="social-link">Instagram</a>`;
    }
    if (social.twitter) {
        socialLinksContainer.innerHTML += `<a href="${social.twitter}" target="_blank" class="social-link">Twitter</a>`;
    }
}

function updateLocationHours(locationHours) {
    const footerHours = document.getElementById('footer-hours');
    if (!footerHours) return;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    footerHours.innerHTML = '';

    days.forEach((day, index) => {
        if (locationHours[day]) {
            const hourLine = document.createElement('p');
            hourLine.className = 'hours-line';
            hourLine.textContent = `${dayNames[index]}: ${locationHours[day].open} - ${locationHours[day].close}`;
            footerHours.appendChild(hourLine);
        }
    });

    // Update header hours if present
    updateHeaderHours(locationHours);
}

function updateHeaderHours(locationHours) {
    const headerHoursText = document.getElementById('header-hours-text');
    if (!headerHoursText) return;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];

    if (locationHours[today]) {
        headerHoursText.textContent = `Open Today: ${locationHours[today].open} - ${locationHours[today].close}`;
        headerHoursText.style.display = 'block';
    }
}

console.log('[Site Loader] Script loaded');
