const { SerialNumberDecoder } = require('./decoder.js');

const testSerials = [
    'P5-MS-507320-0612-101725',      // Regular, no plant code
    '5-MS-462975-0612-090224R',       // Repo with R suffix on date
    'P5-C-466341-1228-100524R',       // Repo with R suffix on date
    'P5-DS-249547-1012-071322-TX1'    // With plant code
];

console.log('Testing Serial Number Decoder - Full Details:\n');

testSerials.forEach(serial => {
    const decoder = new SerialNumberDecoder(serial);
    const details = decoder.getFullDetails();

    console.log(`Serial: ${serial}`);
    console.log(`  Type: ${details.type.name}`);
    console.log(`  Size: ${details.size.display}`);
    console.log(`  Date Built: ${details.dateBuilt.display}`);
    console.log(`  Plant Code: "${details.plant.code}"`);
    console.log(`  Is Repo: ${details.status === 'repo' ? 'YES' : 'NO'}`);
    console.log('');
});
