import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules']);
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    if (ignored.has(entry)) continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const files = await walk(root);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const production = htmlFiles.filter(f => path.basename(f) === 'index.html');
const errors = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
let checkedLinks = 0;

function capture(html, regex) { return html.match(regex)?.[1]?.trim(); }
function addUnique(map, value, file, label) {
  if (!value) return errors.push(`${file}: missing ${label}`);
  if (map.has(value)) errors.push(`${file}: duplicate ${label} with ${map.get(value)}`);
  else map.set(value, file);
}
function localTarget(href, fromFile) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  if (clean.startsWith('/')) {
    if (clean.endsWith('/')) return path.join(root, clean, 'index.html');
    return path.join(root, clean);
  }
  const resolved = path.resolve(path.dirname(fromFile), clean);
  return clean.endsWith('/') ? path.join(resolved, 'index.html') : resolved;
}

for (const file of htmlFiles) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  const html = await readFile(file, 'utf8');
  const h1s = [...html.matchAll(/<h1(?:\s[^>]*)?>/gi)].length;
  if (h1s !== 1) errors.push(`${rel}: expected one H1, found ${h1s}`);
  for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch (e) { errors.push(`${rel}: invalid JSON-LD (${e.message})`); }
  }
  for (const hit of html.matchAll(/(?:href|src)="([^"]+)"/gi)) {
    const href = hit[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    checkedLinks++;
    const target = localTarget(href, file);
    if (target && !files.includes(target)) errors.push(`${rel}: broken local reference ${href}`);
  }
  if (file.endsWith('404.html')) {
    if (!/<meta name="robots" content="noindex,follow">/.test(html)) errors.push('404.html: missing noindex');
    continue;
  }
  addUnique(titles, capture(html, /<title>([^<]+)<\/title>/i), rel, 'title');
  addUnique(descriptions, capture(html, /<meta name="description" content="([^"]+)"/i), rel, 'meta description');
  const canonical = capture(html, /<link rel="canonical" href="([^"]+)"/i);
  addUnique(canonicals, canonical, rel, 'canonical');
  if (!canonical?.startsWith('https://sribharathi.com/')) errors.push(`${rel}: canonical is not production HTTPS`);
  if (!/<meta name="robots" content="index,follow,max-image-preview:large">/.test(html)) errors.push(`${rel}: index robots directive missing`);
}

async function assertOrder(relativeFile, labels) {
  const html = await readFile(path.join(root, relativeFile), 'utf8');
  let previous = -1;
  for (const label of labels) {
    const current = html.indexOf(label, previous + 1);
    if (current < 0 || current < previous) {
      errors.push(`${relativeFile}: expected business order ${labels.join(' → ')}`);
      return;
    }
    previous = current;
  }
}
await assertOrder('index.html', ['<h3>Industrial filtration</h3>', '<h3>Technology</h3>', '<h3>Chemicals</h3>']);
await assertOrder('businesses/index.html', ['<h2>Industrial filtration</h2>', '<h2>Technology</h2>', '<h2>Chemicals</h2>']);
await assertOrder('contact/index.html', ['<p class="tag">Filtration</p>', '<p class="tag">Technology</p>', '<p class="tag">Chemicals</p>']);
await assertOrder('404.html', ['<h2>Filtration</h2>', '<h2>Technology</h2>', '<h2>Chemicals</h2>']);

const sitemap = await readFile(path.join(root,'sitemap.xml'),'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if (sitemapUrls.length !== production.length) errors.push(`sitemap: ${sitemapUrls.length} URLs for ${production.length} indexable pages`);
for (const canonical of canonicals.keys()) if (!sitemapUrls.includes(canonical)) errors.push(`sitemap: missing ${canonical}`);
if (!errors.length) {
  console.log(`PASS: ${production.length} indexable pages; ${titles.size} unique titles; ${descriptions.size} unique descriptions; ${canonicals.size} unique canonicals; ${checkedLinks} local references; JSON-LD parsed.`);
} else {
  console.error(`FAIL: ${errors.length} issue(s)\n${errors.join('\n')}`);
  process.exitCode = 1;
}
