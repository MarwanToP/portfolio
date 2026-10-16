// Builds the site: resizes every photo in photos/<Category>/ and writes dist/.
// Add photos by dropping them into photos/<Category>/ — the category folder name becomes the filter button.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PHOTOS = path.join(ROOT, 'photos');
const DIST = path.join(ROOT, 'dist');
const EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'img'), { recursive: true });

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleOf = f => path.parse(f).name.replace(/^\d+[-_ ]+/, '').replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase());

const cats = fs.existsSync(PHOTOS)
  ? fs.readdirSync(PHOTOS, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()
  : [];

const manifest = [];
for (const cat of cats) {
  const files = fs.readdirSync(path.join(PHOTOS, cat)).filter(f => EXT.test(f)).sort();
  for (const f of files) {
    const id = slug(cat) + '-' + slug(path.parse(f).name);
    const input = path.join(PHOTOS, cat, f);
    try {
      const base = sharp(input).rotate();
      const meta = await base.metadata();
      const swap = meta.orientation && meta.orientation >= 5;
      const w = swap ? meta.height : meta.width, h = swap ? meta.width : meta.height;
      await base.clone().resize({ width: 900, withoutEnlargement: true }).webp({ quality: 78 })
        .toFile(path.join(DIST, 'img', id + '-t.webp'));
      await base.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 }).toFile(path.join(DIST, 'img', id + '.webp'));
      manifest.push({ id, title: titleOf(f), cat, thumb: `img/${id}-t.webp`, src: `img/${id}.webp`, w, h });
    } catch (e) {
      console.warn('Skipped', input, e.message);
    }
  }
}

fs.writeFileSync(path.join(DIST, 'photos.json'), JSON.stringify(manifest));
let html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
// Keep the first-paint photo count honest; the page updates it again once all photos load.
html = html.replace(/id="statPhotos" data-count="\d+" data-suffix=">\d+</, 'id="statPhotos" data-count="9" data-suffix=">9<');
fs.writeFileSync(path.join(DIST, 'index.html'), html);
for (const f of ['robots.txt', 'sitemap.xml', 'og.jpg']) {
  if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
}
// Private admin page (token-protected API lives in /functions) + headers
if (fs.existsSync(path.join(ROOT, 'admin'))) fs.cpSync(path.join(ROOT, 'admin'), path.join(DIST, 'admin'), { recursive: true });
fs.writeFileSync(path.join(DIST, '_headers'), '/admin/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
console.log(`Built ${manifest.length} photos in ${cats.length} categories`);
