import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ROOT } from './inline.mjs';

const log = (m) => console.log(m);

const GIT_CANDIDATES = [
  'git',
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
];

function resolveGit() {
  for (const candidate of GIT_CANDIDATES) {
    try {
      execSync(`"${candidate}" --version`, { stdio: 'pipe', encoding: 'utf8' });
      return candidate;
    } catch {
      /* coba berikutnya */
    }
  }
  return null;
}

const GIT = resolveGit();

const git = (cwd, ...args) =>
  execSync(`"${GIT}" ${args.map((a) => `"${a}"`).join(' ')}`, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8',
  }).trim();

const BRANCH = process.env.DEPLOY_BRANCH || 'gh-pages';
const DRY_RUN = process.argv.includes('--dry-run');

function build() {
  log('› Build…');
  execSync('node scripts/build.mjs', { cwd: ROOT, stdio: 'inherit' });
}

function stage(dir) {
  // Hanya file yang dibutuhkan situs
  const items = ['index.html', 'Assets', 'dist', 'LICENSE'];
  for (const item of items) {
    const src = join(ROOT, item);
    try {
      cpSync(src, join(dir, item), { recursive: true });
    } catch {
      log(`  ! lewati ${item} (tidak ada)`);
    }
  }
  // File berat yang tidak dipakai halaman (hemat kuota GitHub Pages 1 GB)
  const skip = ['Black White Grunge Music Presentation 2.pdf'];
  for (const name of skip) {
    rmSync(join(dir, 'Assets', 'Image', name), { force: true });
    log(`  ! tidak ikut deploy: ${name}`);
  }
  rmSync(join(dir, 'dist', 'css', 'output.css.map'), { force: true });
  // Flag agar GitHub Pages menyajikan file/diagram apa adanya
  writeFileSync(join(dir, '.nojekyll'), '');
}

function main() {
  console.log('\n=== DEPLOY PEROMPAK SOMALIA ===\n');

  if (!GIT) {
    console.error('✖ Git tidak ditemukan. Pasang Git atau tambahkan ke PATH.');
    process.exit(1);
  }

  build();

  let remote;
  try {
    remote = git(ROOT, 'remote', 'get-url', 'origin');
  } catch {
    console.error('✖ Tidak ada remote "origin". Jalankan: git remote add origin <url>');
    process.exit(1);
  }
  log(`› Remote  : ${remote}`);
  log(`› Branch  : ${BRANCH}`);

  const dir = join(tmpdir(), 'perompak-deploy');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  try {
    git(dir, 'init', '-q');
    git(dir, 'remote', 'add', 'origin', remote);

    // Pastikan commit punya identitas walau repo ini belum pernah commit
    try {
      git(dir, 'config', 'user.name');
    } catch {
      git(dir, 'config', 'user.name', git(ROOT, 'config', 'user.name'));
      git(dir, 'config', 'user.email', git(ROOT, 'config', 'user.email'));
    }

    let hasBranch = true;
    try {
      git(dir, 'fetch', '-q', '--depth', '1', 'origin', BRANCH);
    } catch {
      hasBranch = false;
    }

    if (hasBranch) {
      git(dir, 'checkout', '-q', '-B', BRANCH, 'FETCH_HEAD');
    } else {
      git(dir, 'checkout', '-q', '--orphan', BRANCH);
      try {
        git(dir, 'rm', '-rq', '--cached', '.');
      } catch {
        /* repo kosong, tidak ada yang perlu dilepas */
      }
    }

    stage(dir);

    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', `deploy: ${new Date().toISOString()}`);

    const files = git(dir, 'ls-files').split('\n').length;
    log(`› ${files} file siap di-deploy`);

    if (DRY_RUN) {
      console.log('\n✔ DRY RUN — tidak ada yang di-push. Isi branch:');
      console.log(git(dir, 'ls-files').split('\n').slice(0, 20).join('\n'));
      console.log('  ...\n');
      return;
    }

    log('› Push ke origin…');
    git(dir, 'push', '-q', 'origin', BRANCH, '--force');

    console.log('\n✔ Deploy selesai.');
    console.log(`  Branch : ${BRANCH}`);
    console.log(`  URL    : https://<user>.github.io/<repo>/`);
    console.log('  (aktifkan Pages: Settings → Pages → Source = branch "gh-pages")\n');
  } catch (err) {
    console.error('\n✖ Deploy gagal:', err.stderr?.toString() || err.message);
    process.exit(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main();
