import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
const routes = ['/', '/about/', '/businesses/', '/filtration/', '/technology/', '/chemicals/', '/industries/', '/innovation/', '/quality/', '/resources/', '/resources/understanding-depth-filtration/', '/contact/', '/404.html'];
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'wide-desktop', width: 1920, height: 1080 }
];
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const errors = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error') errors.push(`${viewport.name} console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`${viewport.name} page: ${error.message}`));
  for (const route of routes) {
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    if (response.status() !== 200) errors.push(`${viewport.name} ${route}: expected 200, got ${response.status()}`);
    if (await page.locator('h1').count() !== 1) errors.push(`${viewport.name} ${route}: rendered H1 count is not one`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) errors.push(`${viewport.name} ${route}: horizontal overflow`);
    if (await page.locator('header nav a').count() < 7) errors.push(`${viewport.name} ${route}: essential HTML navigation is incomplete`);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    const brokenImages = await page.evaluate(() => [...document.images].filter(image => !image.complete || image.naturalWidth === 0).length);
    if (brokenImages) errors.push(`${viewport.name} ${route}: ${brokenImages} broken rendered image(s)`);
  }
  await context.close();
}

const requestContext = await browser.newContext();
const missingResponse = await requestContext.request.get(base + '/missing-test-route');
if (missingResponse.status() !== 404) errors.push(`/missing-test-route: expected 404, got ${missingResponse.status()}`);
await requestContext.close();

await mkdir('docs/screenshots', { recursive: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const desktopPage = await desktop.newPage();
await desktopPage.goto(base + '/', { waitUntil: 'networkidle' });
await desktopPage.screenshot({ path: 'docs/screenshots/home-desktop.png', fullPage: true });
await desktopPage.goto(base + '/filtration/', { waitUntil: 'networkidle' });
await desktopPage.screenshot({ path: 'docs/screenshots/filtration-desktop.png', fullPage: true });
await desktop.close();

const wide = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const widePage = await wide.newPage();
await widePage.goto(base + '/', { waitUntil: 'networkidle' });
const homeHeroHeight = await widePage.locator('.hero').evaluate(element => element.getBoundingClientRect().height);
const homeHeroTop = await widePage.locator('.hero').evaluate(element => element.getBoundingClientRect().top);
await widePage.screenshot({ path: 'docs/screenshots/home-wide.png', fullPage: false });
await widePage.goto(base + '/businesses/', { waitUntil: 'networkidle' });
await widePage.evaluate(() => window.scrollTo(0, 0));
const businessesHeroHeight = await widePage.locator('.hero').evaluate(element => element.getBoundingClientRect().height);
const businessesHeroTop = await widePage.locator('.hero').evaluate(element => element.getBoundingClientRect().top);
if (Math.abs(homeHeroHeight - businessesHeroHeight) > 1) errors.push(`hero height mismatch: home ${homeHeroHeight}px, businesses ${businessesHeroHeight}px`);
if (Math.abs(homeHeroTop - businessesHeroTop) > 1) errors.push(`hero top mismatch: home ${homeHeroTop}px, businesses ${businessesHeroTop}px`);
await widePage.screenshot({ path: 'docs/screenshots/businesses-wide.png', fullPage: false });
await wide.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('console', message => { if (message.type() === 'error') errors.push(`mobile interaction console: ${message.text()}`); });
await mobilePage.goto(base + '/', { waitUntil: 'networkidle' });
await mobilePage.getByRole('button', { name: 'Open navigation' }).click();
if (!await mobilePage.getByRole('navigation', { name: 'Mobile' }).isVisible()) errors.push('mobile navigation did not open');
await mobilePage.screenshot({ path: 'docs/screenshots/home-mobile-menu.png', fullPage: true });
await mobilePage.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'About', exact: true }).click();
await mobilePage.waitForLoadState('networkidle');
if (!mobilePage.url().endsWith('/about/')) errors.push('mobile navigation did not reach About');
await mobilePage.goto(base + '/contact/', { waitUntil: 'networkidle' });
await mobilePage.screenshot({ path: 'docs/screenshots/contact-mobile.png', fullPage: true });
await mobile.close();

await browser.close();
if (errors.length) {
  console.error(`FAIL: ${errors.length} rendered issue(s)\n${errors.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${routes.length} routes at 390px, 768px, 1440px and 1920px; navigation, images, overflow, 404, mobile interaction and console checks.`);
}
