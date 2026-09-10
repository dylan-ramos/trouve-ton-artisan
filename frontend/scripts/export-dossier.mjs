import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// This renderer covers the headings, paragraphs and tables used by projet.md.
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const inline = (value) =>
  escape(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const target = href.startsWith('https://')
        ? href
        : new URL(
            href,
            'https://github.com/dylan-ramos/trouve-ton-artisan/blob/dev/docs/dossier/projet.md',
          ).href;
      return `<a href="${target}">${label}</a>`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>');
const source = await readFile('../docs/dossier/projet.md', 'utf8');
const sections = [
  '<section class="cover"><h1>Trouve ton artisan</h1><p>Dossier du projet</p><p>Dylan Ramos — 10 septembre 2026</p><p>Conception, réalisation et validation</p></section>',
];
let table = false;
for (const line of source.split('\n')) {
  if (line.startsWith('# ') || line.startsWith('Auteur :')) continue;
  if (line.startsWith('|')) {
    if (/^\|[\s|:-]+$/.test(line)) continue;
    if (!table) {
      sections.push('<table>');
      table = true;
    }
    sections.push(
      `<tr>${line
        .slice(1, -1)
        .split('|')
        .map((cell) => `<td>${inline(cell.trim())}</td>`)
        .join('')}</tr>`,
    );
    continue;
  }
  if (table) {
    sections.push('</table>');
    table = false;
  }
  if (!line.trim()) continue;
  const heading = /^(#{1,3}) (.*)$/.exec(line);
  sections.push(
    heading
      ? `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`
      : `<p>${inline(line)}</p>`,
  );
}
if (table) sections.push('</table>');
for (const name of ['mcd', 'mld']) {
  const svg = await readFile(`../docs/conception/diagrams/${name}.svg`);
  sections.push(
    `<section class="plate"><h2>${name.toUpperCase()}</h2><img class="diagram" alt="${name.toUpperCase()}" src="data:image/svg+xml;base64,${svg.toString('base64')}"></section>`,
  );
}
for (const name of [
  'accueil',
  'catalogue',
  'fiche',
  'mentions',
  '404',
  'contact-invalide',
]) {
  const pictures = [];
  for (const width of [375, 768, 1440]) {
    const png = await readFile(`../docs/dossier/captures/${name}-${width}.png`);
    pictures.push(
      `<figure><figcaption>${name} — ${width} pixels CSS</figcaption><img alt="${name} à ${width} pixels" src="data:image/png;base64,${png.toString('base64')}"></figure>`,
    );
  }
  sections.push(
    `<section class="plate"><h2>Capture — ${name}</h2><p>Recette locale du 10 septembre 2026 ; ces captures ne sont pas des maquettes Figma.</p><div class="captures">${pictures.join('')}</div></section>`,
  );
}
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Trouve ton artisan — dossier de recette</title><style>
.cover{break-after:page;padding-top:60mm}.cover h1{font-size:34pt}body{font:11pt Arial,sans-serif;color:#213547;line-height:1.45}h1{font-size:26pt}h2{font-size:18pt;break-after:avoid}p{orphans:3;widows:3;break-inside:avoid}a{color:#174d7c}table{border-collapse:collapse;width:100%;font-size:9pt}td{padding:6px;border:1px solid #bcc8d2}tr{break-inside:avoid} .plate{break-before:page} .diagram{display:block;max-height:235mm;max-width:100%;margin:auto}.captures{display:block}.captures figure{margin:0;break-before:page;break-inside:avoid}.captures figure:first-child{break-before:auto}.captures figure:first-child img{max-height:190mm}.captures img{display:block;margin:auto;max-width:100%;width:auto;max-height:225mm;object-fit:contain;object-position:top}.captures figcaption{font-size:9pt}
</style></head><body>${sections.join('\n')}</body></html>`;
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? 'chrome',
});
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: '../docs/dossier/projet-recette.pdf',
    format: 'A4',
    tagged: true,
    outline: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="font-size:9px;width:100%;text-align:center">Trouve ton artisan — version de recette locale</div>',
    footerTemplate:
      '<div style="font-size:9px;width:100%;text-align:center">10 septembre 2026 — <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '18mm', right: '15mm', bottom: '18mm', left: '15mm' },
  });
  await writeFile('audit-results/release/dossier.html', html);
  console.log('PDF de recette exporté avec diagrammes et 18 captures.');
} finally {
  await browser.close();
}
