import { createServer } from 'node:http';
import { createReadStream, statSync, watch } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { inlinePartials, bumpCssVersion, ROOT } from './inline.mjs';

const root = resolve(ROOT);
const port = Number(process.env.PORT ?? 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
};

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = join(root, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));

  if (!target.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let file = target;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 ' + pathname);
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`\n  Perompak Somalia dev server → http://localhost:${port}`);
  console.log('  Menonton partials/ + src/ — perubahan otomatis di-build.\n');
});

let timer = null;
function rebuild(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`\n› Rebuild (${reason})…`);
    try {
      execSync(
        'npx @tailwindcss/cli -i ./src/input.css -o ./dist/css/output.css --minify',
        { cwd: ROOT, stdio: 'inherit', shell: true },
      );
      inlinePartials({ log: (m) => console.log(m) });
      bumpCssVersion({ log: (m) => console.log(m) });
      console.log('✔ Rebuild selesai — buka http://localhost:' + port);
    } catch (err) {
      console.error('✖ Build gagal:', err.message);
    }
  }, 250);
}

for (const dir of ['partials', 'src']) {
  try {
    watch(join(root, dir), { recursive: true }, (_event, filename) => {
      if (filename && filename.includes('output.css')) return;
      rebuild(`${dir}/${filename ?? ''}`);
    });
  } catch (err) {
    console.warn(`Tidak bisa memantau ${dir}: ${err.message}`);
  }
}
