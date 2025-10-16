/**
 * Serial Number Decoder for Portable Buildings
 *
 * 6-part format: P5-MS-507320-0612-101725-NM3
 * 5-part format: P5-MS-507320-0612-101725 or 5-MS-462975-0612-090224R
 *
 * P5 or 5: Prefix
 * MS: Building Type (MS=Mini Shed, LB=Lofted Barn, etc.)
 * 507320: Unique Serial Number (not related to size)
 * 0612: Size code (0612 = 6x12)
 * 101725 or 090224R: Date Built (MMDDYY, R suffix = Repo)
 * NM3: Plant code (optional, only in 6-part format)
 */

const BUILDING_TYPES = {
    'MS': 'Mini Shed',
    'ES': 'Econo Shed',
    'LB': 'Lofted Barn',
    'LBC': 'Lofted Barn Cabin',
    'SLB': 'Side Lofted Barn',
    'UB': 'Utility Barn',
    'UX': 'Utility Shed',
    'US': 'Urban Shed',
    'CB': 'Cabin',
    'C': 'Cabin',
    'DS': 'Dormer Shed',
    'G': 'Garage',
    'GR': 'Garage',
    'GSX': 'Garden Shed',
    'SH': 'Storage Shed',
    'B': 'Barn',
    'PB': 'Porch Barn',
    'LP': 'Lofted Porch',
    'CPLBC': 'Corner Porch Lofted Barn Cabin',
    'UR': 'Urban Shed'
};

class SerialNumberDecoder {
    constructor(serialNumber) {
        this.serialNumber = serialNumber;
        this.parts = serialNumber.split('-');

        // Handle 5-part serials (no separate plant code)
        // Format: [Prefix]-[Type]-[UniqueID]-[Size]-[Date]
        // or: [Prefix]-[Type]-[UniqueID]-[Size]-[Date]R (R suffix = repo)
        if (this.parts.length === 5) {
            // Just add empty plant code at end
            // The R suffix (if present) stays with the date part
            this.parts.push('');
        }

        this.valid = this.validate();
    }

    validate() {
        return this.parts.length === 6;
    }

    getPrefix() {
        return this.parts[0]; // P5
    }

    getBuildingType() {
        const code = this.parts[1];
        return {
            code: code,
            name: BUILDING_TYPES[code] || 'Unknown Type'
        };
    }

    getSerialNumber() {
        return this.parts[2];
    }

    getSize() {
        const sizeCode = this.parts[3]; // e.g., "0612" or "1012"
        const width = parseInt(sizeCode.substring(0, 2));
        const length = parseInt(sizeCode.substring(2, 4));
        return {
            code: sizeCode,
            width: width,
            length: length,
            display: `${width}x${length}` // Display as "10x12" not "10'x12'"
        };
    }

    getDateBuilt() {
        let dateCode = this.parts[4]; // e.g., "101725" or "090224R"

        // Strip R suffix if present (repo indicator)
        if (dateCode.endsWith('R')) {
            dateCode = dateCode.slice(0, -1);
        }

        const month = dateCode.substring(0, 2);
        const day = dateCode.substring(2, 4);
        const year = dateCode.substring(4, 6);

        return {
            code: dateCode,
            display: `${month}/${day}/20${year}`,
            month: month,
            day: day,
            year: `20${year}`
        };
    }

    getPlantCode() {
        const plantCode = this.parts[5] || '';
        const isRepo = plantCode.endsWith('R') || this.serialNumber.endsWith('R');

        return {
            code: plantCode,
            plant: isRepo ? plantCode.slice(0, -1) : plantCode,
            isRepo: isRepo
        };
    }

    isRepo() {
        return this.getPlantCode().isRepo;
    }

    getFullDetails() {
        if (!this.valid) {
            return {
                valid: false,
                error: 'Invalid serial number format'
            };
        }

        const type = this.getBuildingType();
        const size = this.getSize();
        const date = this.getDateBuilt();
        const plant = this.getPlantCode();

        return {
            valid: true,
            serialNumber: this.serialNumber,
            type: type,
            size: size,
            dateBuilt: date,
            plant: plant,
            status: plant.isRepo ? 'repo' : 'available',
            title: `${size.display} ${type.name}`,
            description: `Built on ${date.display}. Serial: ${this.getSerialNumber()}`
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SerialNumberDecoder, BUILDING_TYPES };
}
