import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(import.meta.url), '..', '..');
const src = path.join(root, 'recipes', 'images');
const dest = path.join(root, 'public', 'images');

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: false });
  console.log('Images synced to public/images/');
}
