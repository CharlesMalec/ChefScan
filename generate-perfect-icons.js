import sharp from 'sharp';
import fs from 'fs';

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#ffffff"/>
  <g fill="#e88331">
    <path d="M140,260 C90,260 90,160 150,160 C160,90 256,70 256,70 C256,70 352,90 362,160 C422,160 422,260 372,260 Z" />
    <path d="M140,270 L372,270 C382,270 390,278 390,288 L390,420 C390,430 382,438 372,438 L140,438 C130,438 122,430 122,420 L122,288 C122,278 130,270 140,270 Z" />
  </g>
  <g stroke="#ffffff" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 200 320 L 180 320 L 180 340" />
    <path d="M 312 320 L 332 320 L 332 340" />
    <path d="M 180 370 L 180 390 L 200 390" />
    <path d="M 332 370 L 332 390 L 312 390" />
    <circle cx="256" cy="355" r="30" />
  </g>
  <circle cx="256" cy="355" r="10" fill="#ffffff"/>
</svg>
`;

async function generateIcons() {
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile('./public/pwa-192x192.png');
      
    await sharp(Buffer.from(svgIcon))
      .resize(512, 512)
      .png()
      .toFile('./public/pwa-512x512.png');
      
    console.log('Generated fresh icons!');
    
    let manifest = fs.readFileSync('./public/manifest.json', 'utf-8');
    manifest = manifest.replace(/pwa-192x192(-v[2-4])?(\.png|\.jpg)/g, 'pwa-192x192.png');
    manifest = manifest.replace(/pwa-512x512(-v[2-4])?(\.png|\.jpg)/g, 'pwa-512x512.png');
    manifest = manifest.replace(/image\/jpeg/g, 'image/png');
    fs.writeFileSync('./public/manifest.json', manifest);

    let sw = fs.readFileSync('./public/sw.js', 'utf-8');
    sw = sw.replace(/pwa-192x192(-v[2-4])?(\.png|\.jpg)/g, 'pwa-192x192.png');
    sw = sw.replace(/pwa-512x512(-v[2-4])?(\.png|\.jpg)/g, 'pwa-512x512.png');
    fs.writeFileSync('./public/sw.js', sw);
    
    console.log('Updated manifest and sw.js');
  } catch (err) {
    console.error(err);
  }
}

generateIcons();
