const { SerialNumberDecoder } = require('./decoder.js');

const testSerials = [
    'P5-MS-507320-0612-101725',
    'P5-GSX-504265-1016-092025',
    '5-MS-462975-0612-090224R',
    'P5-DS-249547-1012-071322',
    '5-UX-434957-1640-121423R'
];

console.log('Testing Serial Number Decoder:\n');

testSerials.forEach(serial => {
    const decoder = new SerialNumberDecoder(serial);
    const details = decoder.getFullDetails();

    console.log(`Serial: ${serial}`);
    console.log(`  Parts: [${decoder.parts.join(', ')}]`);
    console.log(`  Size: ${details.size.display} (from parts[3]="${decoder.parts[3]}")`);
    console.log(`  Type: ${details.type.name}`);
    console.log(`  Valid: ${details.valid}`);
    console.log('');
});
