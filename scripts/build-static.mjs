import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outputDirectory = path.join(root, 'public');
const staticEntries = [
  'index.html',
  'login.html',
  'admin.html',
  'supabase-config.js',
  'assets'
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const entry of staticEntries) {
  await cp(path.join(root, entry), path.join(outputDirectory, entry), { recursive: true });
}

console.log(`Static site built in ${outputDirectory}`);
