/**
 * Dev-Hilfsskript: rendert die laufende App headless und speichert einen
 * Screenshot. Nutzung: node scripts/screenshot.mjs [url] [ausgabe.png]
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3000/';
const out = process.argv[3] ?? 'screenshot.png';

// In der Cloud-Umgebung liegt Chromium fest unter /opt/pw-browsers/chromium;
// lokal (ohne die Variable) nutzt Playwright seinen eigenen Browser-Download.
// Externe Aufrufe (Basemap) laufen dort außerdem über den Umgebungs-Proxy.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const proxyServer = process.env.HTTPS_PROXY;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  ...(proxyServer ? { proxy: { server: proxyServer, bypass: 'localhost' } } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 160)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.screenshot({ path: out });
await browser.close();
console.log('Screenshot gespeichert:', out);
