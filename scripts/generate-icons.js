/**
 * Generate placeholder PWA icons
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple PNG generator for solid color icons with centered text
function createPNG(width, height, color) {
    // PNG file structure
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);  // width
    ihdrData.writeUInt32BE(height, 4); // height
    ihdrData.writeUInt8(8, 8);          // bit depth
    ihdrData.writeUInt8(6, 9);          // color type (RGBA)
    ihdrData.writeUInt8(0, 10);         // compression
    ihdrData.writeUInt8(0, 11);         // filter
    ihdrData.writeUInt8(0, 12);         // interlace
    
    const ihdrChunk = createChunk('IHDR', ihdrData);
    
    // IDAT chunk - create raw image data
    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0); // filter byte
        for (let x = 0; x < width; x++) {
            // Create a gradient/pattern for visual appeal
            const centerX = width / 2;
            const centerY = height / 2;
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const maxDist = Math.min(width, height) / 2;
            
            if (dist < maxDist * 0.8) {
                // Inner circle - purple gradient
                const factor = 1 - (dist / (maxDist * 0.8)) * 0.3;
                rawData.push(Math.round(124 * factor)); // R
                rawData.push(Math.round(58 * factor));  // G  
                rawData.push(Math.round(237 * factor)); // B
                rawData.push(255);                        // A
            } else {
                // Outer - transparent
                rawData.push(0);
                rawData.push(0);
                rawData.push(0);
                rawData.push(0);
            }
        }
    }
    
    // Compress using zlib
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idatChunk = createChunk('IDAT', compressed);
    
    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));
    
    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type);
    const crc = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(buffer) {
    let crc = 0xFFFFFFFF;
    const table = makeCRCTable();
    
    for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable() {
    const table = new Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
    }
    return table;
}

// Generate icons
const publicDir = path.join(__dirname, '..', 'public');

// Create icon-192.png
const icon192 = createPNG(192, 192, { r: 124, g: 58, b: 237 });
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
console.log('Created icon-192.png');

// Create icon-512.png
const icon512 = createPNG(512, 512, { r: 124, g: 58, b: 237 });
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
console.log('Created icon-512.png');

console.log('PWA icons generated successfully!');
