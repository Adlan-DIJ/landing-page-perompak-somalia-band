# PEROMPAK SOMALIA — Website

Situs band Experimental Surf Rock asal Depok. HTML statis + Tailwind CSS v4 + JavaScript vanilla, tanpa framework dan tanpa backend.

---

## 1. Command (yang sering dipakai)

| Command | Gunanya |
|---|---|
| `npm install` | Pasang dependensi (sekali saja) |
| `npm run dev` | Server lokal → **http://localhost:5173** (auto-rebuild tiap file partial/disimpan) |
| `npm run build` | **Rebuild Tailwind CSS** + inline partial ke `index.html` + cache-buster |
| `npm run watch` | Rebuild otomatis (Tailwind + partial) tanpa server |
| `npm run deploy` | Build + publish ke branch `gh-pages` → tayang di GitHub Pages |

> Di PowerShell, `npm` Sometimes bermasalah dengan execution policy. Pakai `npm.cmd` kalau error:
> `npm.cmd run build`

### Rebuild Tailwind CSS

```bash
npm run build
```

Isinya 3 langkah berurutan:

1. `npx @tailwindcss/cli -i ./src/input.css -o ./dist/css/output.css --minify` → CSS di-minify ke `dist/css/output.css`
2. Partial (`partials/*.html`) di-inline ke `index.html`
3. Cache-buster `?v=` pada link CSS di-update **otomatis** (berubah hanya bila isi CSS berubah)

Kalau cuma mau memantau perubahan tanpa server → `npm run watch`.

---

## 2. Struktur folder

```
index.html          ← file UTAMA (self-contained, bisa dibuka langsung)
partials/           ← sumber untuk tiap bagian (navbar, hero, about, ...)
src/input.css       ← sumber Tailwind
dist/css/output.css ← hasil build Tailwind (minified)
Assets/Image/       ← gambar, logo, foto
scripts/            ← build / dev / deploy
```

### Cara edit konten

- **Bagian halaman** → edit `partials/*.html`, lalu `npm run build` (atau `npm run dev` yang otomatis rebuild).
- **Yang di luar marker `<!-- partial:xxx -->`** (mis. `<head>`, `<footer>` script) → edit langsung di `index.html`.

> Jangan edit isi di antara `<!-- partial:xxx -->` dan `<!-- /partial:xxx -->` di `index.html` — akan tertimpa saat build. Edit `partials/xxx.html`.

---

## 3. Kenapa nomor telepon dulu tidak muncul

Situs ini memuat partial lewat `fetch()` saat runtime. Kalau `index.html` dibuka **langsung** (double-click → `file://`), browser memblokir `fetch` sehingga **tidak ada section yang termuat sama sekali** — termasuk kontak.

Sekarang `npm run build` meng-inline seluruh partial ke dalam `index.html`, jadi:

- ✅ dibuka langsung via `file://` → tetap lengkap
- ✅ di-host di mana saja → lengkap
- ✅ tidak ada masalah cache partial

`fetch()` tetap dipakai hanya untuk *refresh* isi partial saat runtime. Kalau gagal, konten yang sudah ter-inline tetap ditampilkan.

---

## 4. Deploy / Tayangkan ke publik

### Cara A — GitHub Actions (paling mudah)

1. Push repo ke GitHub
2. `Settings → Pages → Source → GitHub Actions`
3. Setiap `git push` ke `main` otomatis deploy

### Cara B — Branch `gh-pages` (manual)

```bash
npm run deploy
```

Script ini membuat branch `gh-pages` berisi `index.html`, `Assets/`, `dist/`, lalu push. Aktifkan Pages dengan **Source = branch `gh-pages`**.

### Cara C — Netlify / Vercel (hosting gratis)

```bash
npx netlify deploy --prod --dir .
npx vercel --prod
```

Folder build: **root repo** (`.`), karena `index.html` ada di root.

---

## 5. Materi promosi (siap pakai)

### Caption Instagram / TikTok

```
🌊 PEROMPAK SOMALIA — surf rock experimental dari Depok.

Single perdana "HASRAT" sudah OUT NOW.
Dengarkan di Spotify, Apple Music, YouTube Music, dan platform favoritmu.

Tinggal klik link di bio ☞ untuk dengar + hubungi kami.
#PerompakSomalia #SurfRock #ExperimentalRock #BandIndonesia #Dspam #DewaLords #HASRAT
```

### Caption WhatsApp / grup (personal)

```
Halo! Kami Perompak Somalia, band surf rock dari Depok.
Single pertama kami "HASRAT" sudah rilis di semua platform musik.

Kalau cocok dengan sx, Listener, tolong share ya 🙏
Kontak booking & kerja sama: 0812-3456-7890
```

### Headline untuk poster / banner

```
PEROMPAK SOMALIA
SINGLE PERDANA "HASRAT" — OUT NOW
Dengerin di Spotify & platform musik lainnya
```

### Checklist jualan ke klien

- [ ] Ganti domain/URL di `index.html` (`og:url`, `canonical`), `robots.txt`, `sitemap.xml`
- [ ] Ganti `hello@noirmusic.com` + `0812-3456-7890` di `partials/contact.html`
- [ ] Ganti foto & logo di `Assets/Image/`
- [ ] Ganti schema.org (`MusicGroup`) bila nama band/genre berbeda
- [ ] Host di Netlify/Vercel/GitHub Pages
- [ ] Daftarkan ke Spotify for Artists & YouTube Content ID
- [ ] Buat kit press (foto 3000px, bio 100 kata, logo PNG/SVG)

---

## 6. Checklist sebelum release

- [ ] `npm run build` dijalankan
- [ ] Buka `index.html` langsung (double-click) → semua section tampil
- [ ] Cek link `tel:` dan `mailto:` menyala di HP
- [ ] Uji tampilan mobile (390px)
- [ ] Cek di PageSpeed Insights
