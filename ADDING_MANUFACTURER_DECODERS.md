# Adding Custom Decoders for Premier and Stor-Mor

## Overview

Currently, only Graceland Portable Buildings has a working serial number decoder. When a Premier or Stor-Mor dealer signs up, you'll need to implement their custom decoder based on their serial number format.

## Current Status

- ✅ **Graceland**: Full decoder implemented in `decoder.js`
- ⏳ **Premier**: Placeholder decoder (returns "Unknown Type", "Unknown Size", etc.)
- ⏳ **Stor-Mor**: Placeholder decoder (returns "Unknown Type", "Unknown Size", etc.)

## How Decoders Work

The `decoder-factory.js` file routes to the appropriate decoder based on manufacturer:

```javascript
const decoder = getDecoder('graceland', serialNumber); // Uses decoder.js
const decoder = getDecoder('premier', serialNumber);   // Uses placeholder
const decoder = getDecoder('stormor', serialNumber);   // Uses placeholder
```

## When to Create Custom Decoders

When a Premier or Stor-Mor dealer signs up and provides example serial numbers, you need to:

1. Analyze their serial number format
2. Create a custom decoder file
3. Update `decoder-factory.js` to use the new decoder

## Step-by-Step: Adding a New Decoder

### Example: Adding Premier Decoder

**Step 1: Get Serial Number Examples**

Ask the dealer for 5-10 example serial numbers and what each represents:
```
Serial: ABC-12345-1012-022524
Type: Utility Shed
Size: 10x12
Date Built: 02/25/2024

Serial: DEF-67890-0810-011523
Type: Lofted Barn
Size: 8x10
Date Built: 01/15/2023
```

**Step 2: Identify the Pattern**

Analyze the format:
- Part 1: Building type code
- Part 2: Unique ID
- Part 3: Size (WWLL format: Width + Length)
- Part 4: Date built (MMDDYY format)

**Step 3: Create Decoder File**

Create `decoder-premier.js`:

```javascript
/**
 * Premier Portable Buildings Serial Number Decoder
 */

const PREMIER_BUILDING_TYPES = {
    'ABC': 'Utility Shed',
    'DEF': 'Lofted Barn',
    'GHI': 'Cabin',
    // Add all building type codes
};

class PremierDecoder {
    constructor(serialNumber) {
        this.serialNumber = serialNumber;
        this.parts = serialNumber.split('-');
        this.valid = this.validate();
    }

    validate() {
        return this.parts.length === 4;
    }

    getBuildingType() {
        const code = this.parts[0];
        return {
            code: code,
            name: PREMIER_BUILDING_TYPES[code] || 'Unknown Type'
        };
    }

    getSize() {
        const sizeCode = this.parts[2];
        const width = parseInt(sizeCode.substring(0, 2));
        const length = parseInt(sizeCode.substring(2, 4));
        return {
            code: sizeCode,
            width: width,
            length: length,
            display: `${width}x${length}`
        };
    }

    getDateBuilt() {
        const dateCode = this.parts[3];
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

        return {
            valid: true,
            serialNumber: this.serialNumber,
            type: type,
            size: size,
            dateBuilt: date,
            plant: { code: '', plant: '', isRepo: false },
            status: 'available',
            title: `${size.display} ${type.name}`,
            description: `Built on ${date.display}. Serial: ${this.parts[1]}`
        };
    }
}

module.exports = { PremierDecoder, PREMIER_BUILDING_TYPES };
```

**Step 4: Update decoder-factory.js**

Replace the Premier placeholder:

```javascript
const { PremierDecoder } = require('./decoder-premier');

function getDecoder(manufacturer, serialNumber) {
    switch (manufacturer) {
        case 'graceland':
            return new GracelandDecoder(serialNumber);

        case 'premier':
            return new PremierDecoder(serialNumber);  // ← Use real decoder

        case 'stormor':
            // Still placeholder
            return { /* ... */ };
    }
}
```

**Step 5: Test the Decoder**

Create `test-premier-decoder.js`:

```javascript
const { PremierDecoder } = require('./decoder-premier');

// Test with real serial numbers
const testSerials = [
    'ABC-12345-1012-022524',
    'DEF-67890-0810-011523',
];

testSerials.forEach(serial => {
    const decoder = new PremierDecoder(serial);
    const details = decoder.getFullDetails();
    console.log(serial, '→', details.title);
});
```

Run: `node test-premier-decoder.js`

**Step 6: Update Inventory Sync**

The sync process in `api/user/sync-inventory.js` already uses the decoder factory, so it will automatically use the new decoder when syncing Premier buildings.

## Repeat for Stor-Mor

Follow the same steps to create `decoder-stormor.js` when a Stor-Mor dealer signs up.

## Important Notes

1. **Each manufacturer has their own format** - Don't assume they're similar
2. **Test thoroughly** - Get multiple example serial numbers
3. **Handle edge cases** - Repos, special codes, etc.
4. **Document the format** - Add comments explaining each part

## Files to Update

When adding a new decoder:

1. ✅ Create: `decoder-[manufacturer].js` (new decoder file)
2. ✅ Update: `decoder-factory.js` (import and use new decoder)
3. ✅ Create: `test-[manufacturer]-decoder.js` (test file)
4. ✅ Update: This document with the manufacturer's format

## Testing Checklist

- [ ] Decoder correctly identifies building types
- [ ] Size parsing works (width x length)
- [ ] Date parsing is accurate
- [ ] Handles invalid serial numbers gracefully
- [ ] Returns proper title format
- [ ] Works with inventory sync process
- [ ] Displays correctly on dealer sites

## Questions?

When a Premier or Stor-Mor dealer signs up, collect:
1. 5-10 example serial numbers
2. What each part of the serial number means
3. List of all building type codes
4. Any special formats (repos, plant codes, etc.)

Then follow this guide to implement their custom decoder!
