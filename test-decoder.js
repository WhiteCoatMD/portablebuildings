const { SerialNumberDecoder } = require('./decoder.js');

// Test the problematic serial number
const serial = 'P5-G-403167-1640-101222';
const decoder = new SerialNumberDecoder(serial);
const details = decoder.getFullDetails();

console.log('Testing serial:', serial);
console.log('Valid:', details.valid);
console.log('Building Type:', details.type);
console.log('Full Details:', JSON.stringify(details, null, 2));
