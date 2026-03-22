import fs from 'fs';
try {
  let manifest = fs.readFileSync('./public/manifest.json', 'utf-8');
  manifest = manifest.split('pwa-192x192.png').join('pwa-192x192-v2.png');
  manifest = manifest.split('pwa-512x512.png').join('pwa-512x512-v2.png');
  fs.writeFileSync('./public/manifest.json', manifest);

  let sw = fs.readFileSync('./public/sw.js', 'utf-8');
  sw = sw.split('pwa-192x192.png').join('pwa-192x192-v2.png');
  sw = sw.split('pwa-512x512.png').join('pwa-512x512-v2.png');
  fs.writeFileSync('./public/sw.js', sw);
  console.log('References updated successfully.');
} catch (e) {
  console.error(e);
}
