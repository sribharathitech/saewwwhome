import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
const routes = ['/', '/about/', '/businesses/', '/filtration/', '/technology/', '/chemicals/', '/industries/', '/innovation/', '/quality/', '/resources/', '/resources/understanding-depth-filtration/', '/contact/', '/404.html'];
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', error => errors.push(`page: ${error.message}`));
for (const route of routes) {
  const response = await page.goto(base + route, { waitUntil: 'networkidle' });
  const expected = 200;
  if (response.status() !== expected) errors.push(`${route}: expected ${expected}, got ${response.status()}`);
  if (await page.locator('h1').count() !== 1) errors.push(`${route}: rendered H1 count is not one`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) errors.push(`${route}: horizontal overflow at desktop viewport`);
}
const missingResponse = await context.request.get(base + '/missing-test-route');
if (missingResponse.status() !== 404) errors.push(`/missing-test-route: expected 404, got ${missingResponse.status()}`);
await mkdir('docs/screenshots', { recursive: true });
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'docs/screenshots/home-desktop.png', fullPage: true });
await page.goto(base + '/filtration/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'docs/screenshots/filtration-desktop.png', fullPage: true });

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('console', message => { if (message.type() === 'error') errors.push(`mobile console: ${message.text()}`); });
await mobilePage.goto(base + '/', { waitUntil: 'networkidle' });
if (await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) errors.push('homepage: horizontal overflow at mobile viewport');
await mobilePage.getByRole('button', { name: 'Open navigation' }).click();
if (!await mobilePage.getByRole('navigation', { name: 'Mobile' }).isVisible()) errors.push('mobile navigation did not open');
await mobilePage.screenshot({ path: 'docs/screenshots/home-mobile-menu.png', fullPage: true });
await mobilePage.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'About', exact: true }).click();
await mobilePage.waitForLoadState('networkidle');
if (!mobilePage.url().endsWith('/about/')) errors.push('mobile navigation did not reach About');
await mobilePage.goto(base + '/contact/', { waitUntil: 'networkidle' });
await mobilePage.screenshot({ path: 'docs/screenshots/contact-mobile.png', fullPage: true });

await browser.close();
if (errors.length) {
  console.error(`FAIL: ${errors.length} rendered issue(s)\n${errors.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${routes.length} rendered routes, desktop/mobile overflow, mobile navigation and console checks.`);
}
