/**
 * Sample Inventory Data
 * In production, this would be loaded from a database or API
 * For now, just add serial numbers here and the decoder handles the rest
 */

const INVENTORY = [
    // Mini Sheds
    {
        serialNumber: 'P5-MS-507320-0612-101725-NM3',
        price: 2850,
        location: 'Lot A'
    },
    {
        serialNumber: 'P5-MS-508421-0810-102025-NM3',
        price: 3200,
        location: 'Lot B'
    },
    {
        serialNumber: 'P5-MS-509122-1012-110125-NM3R', // REPO
        price: 2400,
        location: 'Lot A'
    },

    // Lofted Barns
    {
        serialNumber: 'P5-LB-601234-1016-092025-NM3',
        price: 4500,
        location: 'Lot C'
    },
    {
        serialNumber: 'P5-LB-602156-1220-093025-NM3',
        price: 5200,
        location: 'Lot A'
    },
    {
        serialNumber: 'P5-LB-603089-1424-100525-NM3',
        price: 6100,
        location: 'Lot B'
    },

    // Utility Barns
    {
        serialNumber: 'P5-UB-701445-1216-091525-NM3',
        price: 4800,
        location: 'Lot C'
    },
    {
        serialNumber: 'P5-UB-702334-1020-092525-NM3R', // REPO
        price: 3900,
        location: 'Lot A'
    },

    // Cabins
    {
        serialNumber: 'P5-CB-801567-1224-100125-NM3',
        price: 7500,
        location: 'Lot D'
    },
    {
        serialNumber: 'P5-CB-802445-1428-101025-NM3',
        price: 8900,
        location: 'Lot B'
    },

    // Garages
    {
        serialNumber: 'P5-GR-901234-1220-092025-NM3',
        price: 5600,
        location: 'Lot C'
    },
    {
        serialNumber: 'P5-GR-902156-1424-100825-NM3',
        price: 6800,
        location: 'Lot D'
    }
];

/**
 * Process raw inventory data through the decoder
 * Returns enhanced inventory with decoded information
 */
function processInventory() {
    return INVENTORY.map(item => {
        const decoder = new SerialNumberDecoder(item.serialNumber);
        const details = decoder.getFullDetails();

        if (!details.valid) {
            console.error('Invalid serial number:', item.serialNumber);
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
            isRepo: details.status === 'repo'
        };
    }).filter(item => item !== null);
}

// Make available globally
window.PROCESSED_INVENTORY = processInventory();
