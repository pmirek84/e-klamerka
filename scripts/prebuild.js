import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const templatePath = path.resolve(rootDir, 'template.html');
const indexPath = path.resolve(rootDir, 'index.html');

if (fs.existsSync(templatePath)) {
  fs.copyFileSync(templatePath, indexPath);
  console.log('Restored index.html from template.html for Vite compilation.');
}
