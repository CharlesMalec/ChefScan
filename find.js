import fs from 'fs';
import path from 'path';

function findEnvMjs(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findEnvMjs(fullPath);
    } else if (file === 'env.mjs') {
      console.log(fullPath);
    }
  }
}

findEnvMjs('./node_modules');
