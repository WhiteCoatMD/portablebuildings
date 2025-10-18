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
        logo: '/premierlogo.png',
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
                    title: 'Completely Customizable',
                    description: 'All of our buildings are completely customizable. We can add or take away just about anything you would want, as long as it doesn\'t compromise the integrity of the building.'
                },
                {
                    title: 'No Credit Checks for Rent-to-Own',
                    description: 'We offer an affordable alternative to buying your portable building with a 36 or 48 month rent-to-own contract. A small security deposit and/or your first month\'s rent is all that is due!'
                },
                {
                    title: 'Wide Range of Sizes',
                    description: 'We can build as small as a 6\'x10\' up to a 16\'x54\' building. All buildings feature quality construction and attention to detail.'
                },
                {
                    title: 'Free Delivery',
                    description: 'We offer free delivery up to 50 miles from our closest dealer to the point of delivery. Contact your local dealer for pricing beyond 50 miles.'
                }
            ]
        },

        // About section
        about: {
            title: 'About Premier Portable Buildings',
            description: 'Premier Portable Buildings offers a wide range of building options and sizes to meet your needs. Our buildings are typically delivered within 20 to 25 days from order. We pride ourselves on quality construction, customization options, and flexible rent-to-own programs with no credit checks required.'
        },

        // FAQ section
        faq: [
            {
                question: 'How much are your buildings?',
                answer: 'We offer a wide range of building options and sizes for each. Pricing varies by region and state because of regulations, hauling restrictions, shipping costs and associated material costs. Contact your local dealer for details on pricing in your area, or request a brochure.'
            },
            {
                question: 'Your brochure states "Free Delivery", but I live far away from where I saw the buildings. How far is too far?',
                answer: 'We offer free delivery up to 50 miles from our closest dealer to the point of delivery. You do not have to order the building from the closest dealer to qualify for free delivery. If you are beyond the 50 mile radius, please contact the sales rep for the state in which you live to give you an accurate cost.'
            },
            {
                question: 'What are the dimensions of your buildings?',
                answer: 'We can build as small as a 6\'x10\' up to a 16\'x54\' building. The length of our buildings are always measured from front to back along our floor platform. For width measurements, all 8\', 10\', and 14\' wide buildings are measured wall-to-wall, except 12\' wide buildings which are measured eave-to-eave.'
            },
            {
                question: 'I would like to add a window to a building and change where the door is located. Can I customize the building?',
                answer: 'Absolutely! All of our buildings are completely customizable. We have a standard placement for doors and windows, but if you would like an additional door, window, roll-up, etc., we can easily accommodate. We can add or take away just about anything you would want, as long as it doesn\'t compromise the integrity of the building.'
            },
            {
                question: 'Do I need good credit for the Rent-to-Own option?',
                answer: 'WE DO NOT DO CREDIT CHECKS! We offer an affordable alternative to buying your portable building by signing a 36 or 48 month rent-to-own contract. A small security deposit and/or your first month\'s rent is all that is due to get a building delivered to you!'
            },
            {
                question: 'I ordered a building. When should I expect it to be delivered?',
                answer: 'Our buildings are typically delivered within 20 to 25 days from the date we receive your order. Currently, due to increase in demand and in response to COVID-19, deliveries are between 4 and 6 weeks. Weather and ground conditions may also affect delivery.'
            },
            {
                question: 'Do I need a specific foundation for my building?',
                answer: 'The only requirement is a general level location for your building to sit on (we will level the building up to 18"). Our buildings are designed to rest directly on their skids. In order to level the building we use treated wood blocks. If you would like to have your building on concrete blocks, we only require that you provide the blocks.'
            },
            {
                question: 'What if my new building will not fit through my gate or around my fence?',
                answer: 'Premier Portable Buildings now offers custom built on-site options in most locations. If your limited on space, give us a call extension 2048 to request a custom build-on-site option. (additional fees apply for on-site builds)'
            },
            {
                question: 'How much space should be allowed to deliver a building?',
                answer: 'A vertical space of 14\', measured from the ground to the top of the building when it is on the trailer, is required. Be sure to take any tree branches and utility wires into account. While our drivers are very skilled with a Mule, he will still need a minimum of 1\' of space to maneuver the building through an opening. That is, a building 12\' wide will require a 14-foot wide space (1 foot on each side). If you would like to discuss an on-site build, please dial extension 2048.'
            },
            {
                question: 'Do I need to have permits for my building?',
                answer: 'You are responsible for contacting your local city and county agencies in regard to zoning, permits, setbacks, and covenants. Also, it is recommended that you contact your Home Owners Association (if applicable) to determine what neighborhood rules and regulations may be in place.'
            }
        ],

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
