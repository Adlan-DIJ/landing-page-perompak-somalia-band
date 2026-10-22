import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter((f) => /\.(html|css|js|mjs)$/.test(f));
const missing = new Set();
let checked = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const dir = dirname(file);
  for (const m of text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const url = m[1];
    if (/^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(url)) continue;
    const clean = url.split('#')[0].split('?')[0];
    if (!clean) continue;
    checked++;
    const rel = decodeURIComponent(clean);
    // Partial memakai path relatif terhadap root situs (hasilnya di-inline ke index.html)
    const candidates = [join(ROOT, rel), join(dir, rel)];
    if (!candidates.some((t) => existsSync(t))) missing.add(`${file.replace(ROOT + '\\', '')} → ${clean}`);
  }
}

console.log(`Referensi lokal diperiksa: ${checked}`);
if (missing.size) {
  console.log('\nHILANG:');
  for (const m of missing) console.log('  ✖ ' + m);
  process.exitCode = 1;
} else {
  console.log('✓ Semua referensi lokal ada');
}
