import { watch } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { inlinePartials, bumpCssVersion, ROOT } from './inline.mjs';

const log = (m) => console.log(m);

console.log('\n=== WATCH PEROMPAK SOMALIA ===');
console.log('  Menonton partials/ dan src/ — simpan file untuk rebuild otomatis.\n');

let timer = null;
function rebuild(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`\n› Rebuild (${reason})…`);
    try {
      execSync('npx @tailwindcss/cli -i ./src/input.css -o ./dist/css/output.css --minify', {
        cwd: ROOT,
        stdio: 'inherit',
        shell: true,
      });
      inlinePartials({ log });
      bumpCssVersion({ log });
    } catch (err) {
      console.error('✖ Build gagal:', err.message);
    }
  }, 250);
}

for (const dir of ['partials', 'src']) {
  try {
    watch(join(ROOT, dir), { recursive: true }, (_e, filename) => {
      if (filename && String(filename).includes('output.css')) return;
      rebuild(`${dir}/${filename ?? ''}`);
    });
  } catch (err) {
    console.warn(`Tidak bisa memantau ${dir}: ${err.message}`);
  }
}
