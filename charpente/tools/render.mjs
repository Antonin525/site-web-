// Régénère les rendus fixes du dossier img/ à partir des modèles 3D.
// Usage : node tools/render.mjs [--cpu] [--preview] [--frames=48] [nom ...]
//   --cpu      force le rendu logiciel (machine sans GPU)
//   --preview  petites images, 1 passe (pour régler les cadrages)
// Nécessite Playwright : npm i -D playwright && npx playwright install chromium
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const names = args.filter((a) => !a.startsWith('--'));
const preview = flag('preview');
const outDir = path.resolve(root, opt('out', preview ? 'tools/preview' : 'img'));

const SIZES = {
  hero: [2400, 1100], anatomie: [1800, 1100], methode: [1600, 1200],
  traditionnelle: [1600, 1200], ossature: [1600, 1200], lamelle: [1600, 1200],
  surelevation: [1600, 1200], pergola: [1600, 1200], renovation: [1600, 1200],
};
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const launchArgs = flag('cpu') ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: launchArgs });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('page:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://localhost:${port}/tools/render.html`);
await page.waitForFunction(() => window.__ready === true);
const all = await page.evaluate(() => window.SHOT_NAMES);
fs.mkdirSync(outDir, { recursive: true });
const list = names.length ? names : [...all, 'og'];
for (const name of list) {
  const og = name === 'og';
  let [w, h] = og ? [1200, 630] : SIZES[name];
  if (preview) { w = Math.round(w / 3); h = Math.round(h / 3); }
  const frames = preview ? 1 : +opt('frames', og ? 32 : 48);
  const t0 = Date.now();
  const url = await page.evaluate(([n, o]) => window.renderShot(n, o), [og ? 'hero' : name, { width: w, height: h, frames, background: og }]);
  const ext = og ? 'jpg' : 'webp';
  const file = path.join(outDir, `${og ? 'og-image' : name}.${ext}`);
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${path.relative(root, file)}  ${w}×${h}  ${frames} passes  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await browser.close();
server.close();
