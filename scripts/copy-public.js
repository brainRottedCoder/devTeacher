/**
 * Copy public folder files to standalone output
 * Run after Next.js build to ensure PWA assets are available
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
const staticDir = path.join(standaloneDir, 'static');

// Check if we're in standalone mode
if (!fs.existsSync(standaloneDir)) {
    console.log('Not running in standalone mode, skipping public copy');
    process.exit(0);
}

// Ensure static directory exists
if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
    'manifest.json',
    'sw.js',
    'icon-192.png',
    'icon-512.png',
];

// Copy each file
filesToCopy.forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(standaloneDir, file);
    
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to standalone output`);
    } else {
        console.warn(`Warning: ${file} not found in public folder`);
    }
});

console.log('Public folder files copied successfully!');
