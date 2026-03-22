import fs from 'fs';

fs.renameSync('./public/pwa-192x192-clean.png', './public/pwa-192x192.png');
fs.renameSync('./public/pwa-512x512-clean.png', './public/pwa-512x512.png');
console.log('Renamed successfully');
