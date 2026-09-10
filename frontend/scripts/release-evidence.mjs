import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5180';
const output = 'audit-results/release';
const captures = '../docs/dossier/captures';
await mkdir(output, { recursive: true });
await mkdir(captures, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? 'chrome',
});
try {
  const page = await browser.newPage();
  const routes = [
    ['accueil', '/'],
    ['catalogue', '/artisans/alimentation'],
    ['fiche', '/artisan/chocolaterie-labbe'],
    ['mentions', '/mentions-legales'],
    ['404', '/adresse-inconnue'],
    ['recherche', '/recherche?search=Labb%C3%A9'],
    ['vide', '/recherche?search=introuvable'],
    ['donnees', '/donnees-personnelles'],
    ['accessibilite', '/accessibilite'],
    ['cookies', '/cookies'],
  ];
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1024 });
    for (const [name, route] of routes) {
      await page.goto(new URL(route, baseUrl).href);
      await page.locator('main h1').waitFor();
      await page.waitForFunction(
        () => !document.querySelector('.loading-state'),
      );
      await page.evaluate(() => document.fonts.ready);
      if (await page.locator('[role="alert"]').count())
        throw new Error(`Page unavailable: ${route}`);
      if (width === 1440)
        await writeFile(`${output}/${name}.html`, await page.content());
      if (['accueil', 'catalogue', 'fiche', 'mentions', '404'].includes(name)) {
        await page.screenshot({
          path: `${captures}/${name}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page.goto(new URL('/artisan/chocolaterie-labbe', baseUrl).href);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await page.screenshot({
      path: `${captures}/contact-invalide-${width}.png`,
      fullPage: true,
    });
    if (width === 1440)
      await writeFile(`${output}/contact-invalide.html`, await page.content());
  }
  const sheets = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((nodes) => nodes.map((node) => node.href));
  for (const [index, href] of sheets.entries()) {
    const response = await page.request.get(href);
    if (!response.ok()) throw new Error('Stylesheet unavailable');
    await writeFile(`${output}/styles-${index}.css`, await response.body());
  }
  await writeFile(
    `${output}/capture.json`,
    JSON.stringify(
      {
        date: new Date().toISOString(),
        baseUrl,
        widths: [375, 768, 1440],
        routes,
      },
      null,
      2,
    ),
  );
  console.log(
    '18 captures et 11 DOM finaux exportés ; CSS compilé enregistré.',
  );
} finally {
  await browser.close();
}
