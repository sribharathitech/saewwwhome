import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const skip = new Set(['.git', 'node_modules', 'docs']);
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    if (skip.has(entry)) continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) out.push(...await walk(full));
    else if (full.endsWith('.html')) out.push(full);
  }
  return out;
}
const urls = new Set();
for (const file of await walk(root)) {
  const html = await readFile(file, 'utf8');
  for (const hit of html.matchAll(/href="(https:\/\/[^"#]+)[^"]*"/g)) {
    if (!hit[1].startsWith('https://sribharathi.com')) urls.add(hit[1]);
  }
}
const results = await Promise.all([...urls].map(async url => {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: {'user-agent':'Sri-Bharathi-site-link-check/1.0'} });
    await response.body?.cancel();
    return { url, status: response.status };
  } catch (error) { return { url, status: 'ERROR', detail: error.message }; }
}));
const failed = results.filter(result => result.status === 'ERROR' || result.status >= 400);
console.log(`Checked ${results.length} unique specialist-site links: ${results.length - failed.length} reachable, ${failed.length} failed.`);
for (const item of failed) console.error(`${item.status} ${item.url}${item.detail ? ` — ${item.detail}` : ''}`);
if (failed.length) process.exitCode = 1;
