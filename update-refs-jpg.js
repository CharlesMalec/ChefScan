import fs from 'fs';
try {
  let manifest = fs.readFileSync('./public/manifest.json', 'utf-8');
  manifest = manifest.split('pwa-192x192-v2.png').join('pwa-192x192-v3.jpg');
  manifest = manifest.split('pwa-512x512-v2.png').join('pwa-512x512-v3.jpg');
  manifest = manifest.split('image/png').join('image/jpeg');
  fs.writeFileSync('./public/manifest.json', manifest);

  let sw = fs.readFileSync('./public/sw.js', 'utf-8');
  sw = sw.split('pwa-192x192-v2.png').join('pwa-192x192-v3.jpg');
  sw = sw.split('pwa-512x512-v2.png').join('pwa-512x512-v3.jpg');
  fs.writeFileSync('./public/sw.js', sw);
  console.log('References updated successfully to JPG.');
} catch (e) {
  console.error(e);
}
