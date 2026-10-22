import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'index.html');
const PARTIALS = join(ROOT, 'partials');

function readPartial(name) {
  const file = join(PARTIALS, `${name}.html`);
  return existsSync(file) ? readFileSync(file, 'utf8').trim() : null;
}

/**
 * Menyisipkan konten partials/*.html ke dalam index.html.
 *
 * Dua tahap:
 *  1. Slot <div data-include="x"></div> diubah menjadi marker
 *     <!-- partial:x --> ... <!-- /partial:x -->
 *  2. Konten di dalam marker diisi ulang dari partials/x.html
 *
 * Proses ini idempoten: dijalankan berkali-kali hasilnya sama,
 * dan perubahan manual di dalam index.html tetap dipertahankan
 * (hanya isi marker yang ditulis ulang).
 */
export function inlinePartials({ write = true, log = () => {} } = {}) {
  let html = readFileSync(INDEX, 'utf8');
  const before = html;

  html = html.replace(
    /[ \t]*<div data-include="([a-z0-9_-]+)"><\/div>[ \t]*\r?\n/g,
    (_m, name) =>
      `<div data-include="${name}">\n<!-- partial:${name} -->\n<!-- /partial:${name} -->\n</div>\n`,
  );

  const used = [];
  html = html.replace(
    /<!-- partial:([a-z0-9_-]+) -->[\s\S]*?<!-- \/partial:\1 -->/g,
    (_m, name) => {
      const content = readPartial(name);
      if (content === null) {
        log(`  ! partial "${name}.html" tidak ditemukan — isi marker dikosongkan`);
        return `<!-- partial:${name} -->\n<!-- /partial:${name} -->`;
      }
      used.push(name);
      return `<!-- partial:${name} -->\n${content}\n<!-- /partial:${name} -->`;
    },
  );

  if (write && html !== before) {
    writeFileSync(INDEX, html);
    log(`  ✓ ${used.length} partial di-inline ke index.html (${used.join(', ')})`);
  }

  return { changed: html !== before, partials: used };
}

/**
 * Memberi cache-buster pada link CSS berdasarkan hash isi file,
 * sehingga hanya berubah ketika CSS benar-benar berubah.
 */
export function bumpCssVersion({ write = true, log = () => {} } = {}) {
  const cssPath = join(ROOT, 'dist', 'css', 'output.css');
  if (!existsSync(cssPath)) return false;

  const hash = readFileSync(cssPath);
  const short = createHash('sha1').update(hash).digest('hex').slice(0, 8);

  const html = readFileSync(INDEX, 'utf8');
  const next = html.replace(/(dist\/css\/output\.css\?v=)[^"']*/, `$1${short}`);
  if (next === html) return false;
  if (write) writeFileSync(INDEX, next);
  log(`  ✓ cache-buster CSS → ?v=${short}`);
  return true;
}
