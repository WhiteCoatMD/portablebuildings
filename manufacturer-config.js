/**
 * Manufacturer Configuration
 * Defines branding and content for each manufacturer
 */

const MANUFACTURERS = {
    graceland: {
        name: 'Graceland Portable Buildings',
        logo: '/public/graceland_logo.png',
        dealerText: 'Authorized Graceland Portable Buildings Dealer',

        // Hero gallery images
        heroImages: [
            { src: 'Cabin-12x24-Angle.jpg', alt: 'Cabin' },
            { src: 'BARN-ANGLED-8x12.jpg', alt: 'Barn' },
            { src: 'Corner-Porch-Cabin.png', alt: 'Corner Porch Cabin' },
            { src: 'GHP-6307.jpg', alt: 'Portable Building' },
            { src: 'Side-Lofted-Barn-10X16-Front-Angled.png', alt: 'Side Lofted Barn' },
            { src: 'Mini-Closed.png', alt: 'Mini Shed' }
        ],

        // Features section
        features: {
            title: 'Why Choose Graceland Portable Buildings?',
            items: [
                {
                    title: 'Unsurpassed Quality',
                    description: 'Built to last for generations, not years. Our master-builders create durable structures designed to stand the test of time.'
                },
                {
                    title: 'Innovative Design',
                    description: 'Featuring our patented soffit ventilation system that allows buildings to breathe, providing unique features not available from other manufacturers.'
                },
                {
                    title: 'Lifetime Warranty',
                    description: 'We stand behind our buildings with an industry-leading lifetime structural warranty, demonstrating our commitment to quality.'
                },
                {
                    title: 'Made in America',
                    description: 'Proudly manufactured in the USA with American materials and craftsmanship you can trust.'
                }
            ]
        },

        // About section
        about: {
            title: 'About Graceland Portable Buildings',
            description: 'Since our founding, Graceland has been committed to building the highest quality portable structures. Our innovative designs and superior craftsmanship have made us a leader in the industry.'
        },

        // Footer text
        footerText: 'Authorized Graceland Portable Buildings Dealer',

        // Color scheme (optional, can be customized per dealer)
        colors: {
            primary: '#bc9c22',  // Gold
            secondary: '#8b7a1e'
        }
    },

    premier: {
        name: 'Premier Portable Buildings',
        logo: '/public/premier_logo.png',
        dealerText: 'Authorized Premier Portable Buildings Dealer',

        // Hero gallery images (will be added later)
        heroImages: [
            { src: 'premier-cabin-1.jpg', alt: 'Premier Cabin' },
            { src: 'premier-barn-1.jpg', alt: 'Premier Barn' },
            { src: 'premier-shed-1.jpg', alt: 'Premier Shed' },
            { src: 'premier-garage-1.jpg', alt: 'Premier Garage' },
            { src: 'premier-cabin-2.jpg', alt: 'Premier Cabin Style 2' },
            { src: 'premier-shed-2.jpg', alt: 'Premier Shed Style 2' }
        ],

        // Features section
        features: {
            title: 'Why Choose Premier Portable Buildings?',
            items: [
                {
                    title: 'Premium Quality',
                    description: 'Built with the finest materials and attention to detail, Premier buildings are designed to exceed your expectations.'
                },
                {
                    title: 'Customizable Options',
                    description: 'Extensive customization options allow you to create the perfect building for your specific needs.'
                },
                {
                    title: 'Trusted Nationwide',
                    description: 'Thousands of satisfied customers across the country trust Premier for their portable building needs.'
                },
                {
                    title: 'American Made',
                    description: 'Proudly manufactured in the USA, supporting American jobs and craftsmanship.'
                }
            ]
        },

        // About section
        about: {
            title: 'About Premier Portable Buildings',
            description: 'Premier Portable Buildings has been a trusted name in portable structures, delivering quality and value to customers nationwide. Our commitment to excellence shows in every building we create.'
        },

        // Footer text
        footerText: 'Authorized Premier Portable Buildings Dealer',

        // Color scheme (optional, can be customized per dealer)
        colors: {
            primary: '#bc9c22',  // Gold (same as Graceland by default, can be changed)
            secondary: '#8b7a1e'
        }
    },

    stormor: {
        name: 'Stor-Mor Portable Buildings',
        logo: '/public/stormor_logo.png',
        dealerText: 'Authorized Stor-Mor Portable Buildings Dealer',

        // Hero gallery images (will be added later)
        heroImages: [
            { src: 'stormor-cabin-1.jpg', alt: 'Stor-Mor Cabin' },
            { src: 'stormor-barn-1.jpg', alt: 'Stor-Mor Barn' },
            { src: 'stormor-shed-1.jpg', alt: 'Stor-Mor Shed' },
            { src: 'stormor-garage-1.jpg', alt: 'Stor-Mor Garage' },
            { src: 'stormor-cabin-2.jpg', alt: 'Stor-Mor Cabin Style 2' },
            { src: 'stormor-utility-1.jpg', alt: 'Stor-Mor Utility Building' }
        ],

        // Features section
        features: {
            title: 'Why Choose Stor-Mor Portable Buildings?',
            items: [
                {
                    title: 'Exceptional Craftsmanship',
                    description: 'Stor-Mor buildings are built with superior craftsmanship and attention to detail that sets them apart from the competition.'
                },
                {
                    title: 'Versatile Designs',
                    description: 'From storage sheds to custom cabins, Stor-Mor offers a wide range of designs to fit any need or budget.'
                },
                {
                    title: 'Proven Durability',
                    description: 'Built to withstand the elements and last for decades, Stor-Mor structures are an investment in quality.'
                },
                {
                    title: 'Value Pricing',
                    description: 'Get the quality you deserve at prices that fit your budget, with flexible financing options available.'
                }
            ]
        },

        // About section
        about: {
            title: 'About Stor-Mor Portable Buildings',
            description: 'Stor-Mor Portable Buildings has built a reputation for creating high-quality, affordable portable structures. With a focus on customer satisfaction and innovative designs, Stor-Mor delivers exceptional value.'
        },

        // Footer text
        footerText: 'Authorized Stor-Mor Portable Buildings Dealer',

        // Color scheme (optional, can be customized per dealer)
        colors: {
            primary: '#bc9c22',  // Gold
            secondary: '#8b7a1e'
        }
    }
};

/**
 * Get manufacturer configuration
 * @param {string} manufacturer - 'graceland' or 'premier'
 * @returns {object} Manufacturer configuration
 */
function getManufacturerConfig(manufacturer) {
    return MANUFACTURERS[manufacturer] || MANUFACTURERS.graceland;
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MANUFACTURERS, getManufacturerConfig };
}
