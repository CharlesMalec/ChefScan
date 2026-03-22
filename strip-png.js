import fs from 'fs';

function stripPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.slice(0, 8);
  if (signature.toString('hex') !== '89504e470d0a1a0a') {
    console.error('Not a valid PNG:', filePath);
    return;
  }

  const chunks = [];
  let offset = 8;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const chunkData = buffer.slice(offset, offset + 12 + length);
    
    // Keep essential chunks and a few common safe ones
    const safeChunks = ['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'sRGB'];
    if (safeChunks.includes(type)) {
      chunks.push(chunkData);
    } else {
      console.log(`Stripping chunk: ${type} (${length} bytes)`);
    }
    
    offset += 12 + length;
  }

  const newBuffer = Buffer.concat([signature, ...chunks]);
  fs.writeFileSync(filePath, newBuffer);
  console.log(`Successfully stripped ${filePath}. New size: ${newBuffer.length} bytes`);
}

stripPng('./public/pwa-192x192.png');
stripPng('./public/pwa-512x512.png');
