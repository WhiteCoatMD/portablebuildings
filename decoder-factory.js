/**
 * Decoder Factory
 * Creates the appropriate serial number decoder based on manufacturer
 */

const { SerialNumberDecoder: GracelandDecoder } = require('./decoder');

/**
 * Get the appropriate decoder for a manufacturer
 * @param {string} manufacturer - 'graceland', 'premier', or 'stormor'
 * @param {string} serialNumber - The serial number to decode
 * @returns {object} Decoder instance
 */
function getDecoder(manufacturer, serialNumber) {
    switch (manufacturer) {
        case 'graceland':
            return new GracelandDecoder(serialNumber);

        case 'premier':
            // TODO: Implement Premier decoder when dealer signs up
            // For now, return a basic decoder that just stores the serial number
            return {
                serialNumber: serialNumber,
                valid: true,
                getBuildingType: () => ({ code: 'UNKNOWN', name: 'Unknown Type' }),
                getSize: () => ({ code: '', width: 0, length: 0, display: 'Unknown Size' }),
                getDateBuilt: () => ({ code: '', display: '', month: '', day: '', year: '' }),
                getPlantCode: () => ({ code: '', plant: '', isRepo: false }),
                isRepo: () => false,
                getFullDetails: () => ({
                    valid: true,
                    serialNumber: serialNumber,
                    type: { code: 'UNKNOWN', name: 'Unknown Type' },
                    size: { code: '', width: 0, length: 0, display: 'Unknown Size' },
                    dateBuilt: { code: '', display: '', month: '', day: '', year: '' },
                    plant: { code: '', plant: '', isRepo: false },
                    status: 'available',
                    title: 'Premier Building',
                    description: `Serial: ${serialNumber}`
                })
            };

        case 'stormor':
            // TODO: Implement Stor-Mor decoder when dealer signs up
            // For now, return a basic decoder that just stores the serial number
            return {
                serialNumber: serialNumber,
                valid: true,
                getBuildingType: () => ({ code: 'UNKNOWN', name: 'Unknown Type' }),
                getSize: () => ({ code: '', width: 0, length: 0, display: 'Unknown Size' }),
                getDateBuilt: () => ({ code: '', display: '', month: '', day: '', year: '' }),
                getPlantCode: () => ({ code: '', plant: '', isRepo: false }),
                isRepo: () => false,
                getFullDetails: () => ({
                    valid: true,
                    serialNumber: serialNumber,
                    type: { code: 'UNKNOWN', name: 'Unknown Type' },
                    size: { code: '', width: 0, length: 0, display: 'Unknown Size' },
                    dateBuilt: { code: '', display: '', month: '', day: '', year: '' },
                    plant: { code: '', plant: '', isRepo: false },
                    status: 'available',
                    title: 'Stor-Mor Building',
                    description: `Serial: ${serialNumber}`
                })
            };

        default:
            // Default to Graceland decoder
            return new GracelandDecoder(serialNumber);
    }
}

/**
 * Decode a serial number based on manufacturer
 * @param {string} manufacturer - 'graceland', 'premier', or 'stormor'
 * @param {string} serialNumber - The serial number to decode
 * @returns {object} Decoded building details
 */
function decodeSerialNumber(manufacturer, serialNumber) {
    const decoder = getDecoder(manufacturer, serialNumber);
    return decoder.getFullDetails();
}

module.exports = {
    getDecoder,
    decodeSerialNumber
};
