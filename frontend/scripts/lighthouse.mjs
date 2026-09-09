import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5180';
const chrome = await launch({
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
});
await mkdir('audit-results/lighthouse', { recursive: true });
try {
  for (const [name, path] of [
    ['home', '/'],
    ['catalog', '/artisans/alimentation'],
    ['artisan', '/artisan/chocolaterie-labbe'],
    ['legal', '/mentions-legales'],
    ['not-found', '/adresse-inconnue'],
  ]) {
    const result = await lighthouse(new URL(path, baseUrl).href, {
      port: chrome.port,
      output: ['json', 'html'],
      onlyCategories: ['accessibility'],
      logLevel: 'error',
    });
    if (!result) throw new Error('Lighthouse did not return a result.');
    await writeFile(`audit-results/lighthouse/${name}.json`, result.report[0]);
    await writeFile(`audit-results/lighthouse/${name}.html`, result.report[1]);
    console.log(
      `${name}: accessibility ${result.lhr.categories.accessibility.score * 100}/100`,
    );
    if (result.lhr.categories.accessibility.score !== 1) process.exitCode = 1;
  }
} finally {
  await chrome.kill();
}
