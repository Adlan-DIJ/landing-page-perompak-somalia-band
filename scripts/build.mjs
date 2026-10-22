import { execSync } from 'node:child_process';
import { inlinePartials, bumpCssVersion, ROOT } from './inline.mjs';

const log = (msg) => console.log(msg);

function buildCss() {
  log('› Build Tailwind CSS…');
  execSync(
    'npx @tailwindcss/cli -i ./src/input.css -o ./dist/css/output.css --minify',
    { cwd: ROOT, stdio: 'inherit', shell: true },
  );
}

function main() {
  console.log('\n=== BUILD PEROMPAK SOMALIA ===\n');
  buildCss();
  console.log('› Inline partial ke index.html…');
  inlinePartials({ log });
  bumpCssVersion({ log });
  console.log('\n✔ Selesai. index.html sekarang mandiri (bisa dibuka langsung / file://).\n');
}

main();
