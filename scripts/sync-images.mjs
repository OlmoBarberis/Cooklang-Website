import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(import.meta.url), '..', '..');
const src = path.join(root, 'recipes', 'images');

if (fs.existsSync(src)) {
  // public/images — used by the dev server
  const devDest = path.join(root, 'public', 'images');
  fs.mkdirSync(devDest, { recursive: true });
  fs.cpSync(src, devDest, { recursive: true, force: false });

  // dist/client/images — used by the Node standalone server
  const prodDest = path.join(root, 'dist', 'client', 'images');
  if (fs.existsSync(path.join(root, 'dist', 'client'))) {
    fs.mkdirSync(prodDest, { recursive: true });
    fs.cpSync(src, prodDest, { recursive: true, force: false });
  }

  console.log('Images synced to public/images/');
}
