import sharp from 'sharp';
import fs from 'fs';

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#c2410c"/>
  <text x="256" y="320" font-family="sans-serif" font-weight="bold" font-size="200" fill="white" text-anchor="middle">CS</text>
</svg>
`;

async function generateIcons() {
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile('./public/pwa-192x192-v4.png');
      
    await sharp(Buffer.from(svgIcon))
      .resize(512, 512)
      .png()
      .toFile('./public/pwa-512x512-v4.png');
      
    console.log('Generated fresh icons!');
    
    let manifest = fs.readFileSync('./public/manifest.json', 'utf-8');
    manifest = manifest.replace(/pwa-192x192-v3\.jpg/g, 'pwa-192x192-v4.png');
    manifest = manifest.replace(/pwa-512x512-v3\.jpg/g, 'pwa-512x512-v4.png');
    manifest = manifest.replace(/image\/jpeg/g, 'image/png');
    fs.writeFileSync('./public/manifest.json', manifest);

    let sw = fs.readFileSync('./public/sw.js', 'utf-8');
    sw = sw.replace(/pwa-192x192-v3\.jpg/g, 'pwa-192x192-v4.png');
    sw = sw.replace(/pwa-512x512-v3\.jpg/g, 'pwa-512x512-v4.png');
    fs.writeFileSync('./public/sw.js', sw);
    
    console.log('Updated manifest and sw.js');
  } catch (err) {
    console.error(err);
  }
}

generateIcons();
