import { chromium } from 'playwright-core';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve('.');
const htmlFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(target);
    else if (entry.name === 'index.html' || entry.name === '404.html') htmlFiles.push(target);
  }
}

await collect(root);
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let target = path.join(root, pathname.replace(/^\/+/, ''));
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    const body = await readFile(target);
    const type = target.endsWith('.css') ? 'text/css' : target.endsWith('.js') ? 'text/javascript' : 'text/html';
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise(resolve => server.listen(4174, '127.0.0.1', resolve));
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
});
const failures = [];
let externalCount = 0;
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 }
];

for (const file of htmlFiles) {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const relative = path.relative(root, file).replaceAll('\\', '/');
    await page.goto(`http://127.0.0.1:4174/${relative}`, { waitUntil: 'load' });
  const results = await page.locator('a[href^="https://"]').evaluateAll(links => links.map(link => {
    const afterStyle = getComputedStyle(link, '::after');
    const after = afterStyle.content.replaceAll('"', '');
    const inSpecialistList = Boolean(link.closest('.division-link-list'));
    const inSpecialistFooter = Boolean(link.closest('.footer-specialists'));
    const listMarker = inSpecialistList
      ? getComputedStyle(link.querySelector('i'), '::before').content.replaceAll('"', '')
      : '';
    const footerMarker = inSpecialistFooter ? link.textContent : '';
    return {
      href: link.href,
      metadata: link.hasAttribute('data-specialist-link') &&
        link.target === '_blank' &&
        link.rel.includes('noopener') &&
        link.rel.includes('noreferrer') &&
        link.getAttribute('aria-describedby') === 'specialist-link-note',
      visibleMarker: after.includes('↗') ||
        listMarker.includes('↗') ||
        footerMarker.includes('↗'),
      alignedMarker: inSpecialistList || inSpecialistFooter || afterStyle.verticalAlign === 'middle',
      darkPanelContrast: !link.closest('.fact-panel:not(.division-links-panel)') || getComputedStyle(link).color === 'rgb(255, 255, 255)'
    };
    }));
    externalCount += results.length;
    for (const result of results) {
      if (!result.metadata || !result.visibleMarker || !result.alignedMarker || !result.darkPanelContrast) {
        failures.push(`${path.relative(root, file)} [${viewport.name}]: ${result.href} metadata=${result.metadata} marker=${result.visibleMarker} aligned=${result.alignedMarker} contrast=${result.darkPanelContrast}`);
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) failures.push(`${path.relative(root, file)} [${viewport.name}]: horizontal overflow`);
    await page.close();
  }
}

await browser.close();
await new Promise(resolve => server.close(resolve));
if (failures.length) {
  console.error(`FAIL: ${failures.length} external link signal issue(s)\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${externalCount} rendered external-link instances across ${htmlFiles.length} pages and ${viewports.length} viewports have visible markers, complete navigation metadata and no horizontal overflow.`);
}
