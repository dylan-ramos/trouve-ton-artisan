import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/artisans/alimentation',
  '/recherche?search=Labb%C3%A9',
  '/recherche?search=introuvable',
  '/artisan/chocolaterie-labbe',
  '/mentions-legales',
  '/donnees-personnelles',
  '/accessibilite',
  '/cookies',
  '/adresse-inconnue',
];

for (const width of [320, 375, 768, 1440]) {
  for (const path of routes) {
    test(`${width}px ${path}`, async ({ page }, testInfo) => {
      const browserErrors: string[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          /Content Security Policy|Refused to/i.test(message.text())
        )
          browserErrors.push(message.text());
      });
      await page.setViewportSize({ width, height: 1024 });
      await page.goto(path);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('.loading-state')).toHaveCount(0);
      await expect(page.locator('[role="alert"]')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      await testInfo.attach('axe', {
        body: JSON.stringify({
          violations: results.violations,
          incomplete: results.incomplete,
        }),
        contentType: 'application/json',
      });
      expect(results.violations).toEqual([]);
      expect(browserErrors).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(
        overflow,
        'La page doit rester lisible sans défilement horizontal',
      ).toBe(false);
    });
  }
}

async function expectAccessible(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test('menu, lien d’évitement et navigation au clavier', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Aller au contenu principal' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const menu = page.getByRole('button', { name: /^(Menu|Fermer)$/ });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expectAccessible(page);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  const category = page.getByRole('link', {
    name: 'Alimentation',
    exact: true,
  });
  await category.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/artisans\/alimentation/);
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('main h1')).toHaveText('Artisans — Alimentation');
});

test('contact : erreurs, focus, envoi, succès et panne annoncés', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/artisan/chocolaterie-labbe');
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Nom', exact: true }),
  ).toBeFocused();
  await expectAccessible(page);
  await page
    .getByRole('textbox', { name: 'Nom', exact: true })
    .fill('Visiteur Test');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('textbox', { name: 'E-mail', exact: true }),
  ).toBeFocused();
  await page.keyboard.type('visitor@example.com');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Demande de devis');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Bonjour, je souhaite un devis.');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Envoyer le message' }),
  ).toBeFocused();
  // Capture at the browser boundary: this audit must never deliver an e-mail.
  await page.route('**/api/artisans/*/contact', async (route) => {
    await route.fulfill({ status: 503, json: { error: { status: 503 } } });
  });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText(
    "Le message n'a pas pu être envoyé.",
  );
  await expectAccessible(page);
  await page.unroute('**/api/artisans/*/contact');
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/artisans/*/contact', async (route) => {
    await pending;
    await route.fulfill({
      status: 202,
      json: { data: { message: 'Message envoyé.' } },
    });
  });
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Envoi du message en cours',
  );
  await expect(
    page.getByRole('button', { name: 'Envoi en cours…' }),
  ).toBeDisabled();
  release?.();
  await expect(page.getByRole('status')).toContainText(
    'Votre message a bien été envoyé.',
  );
  await expectAccessible(page);
});

for (const path of ['/artisans/alimentation', '/artisan/chocolaterie-labbe']) {
  test(`chargement puis erreur : ${path}`, async ({ page }) => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/**', async (route) => {
      if (route.request().url().endsWith('/categories')) {
        await route.continue();
        return;
      }
      await pending;
      await route.fulfill({ status: 503, json: { error: { status: 503 } } });
    });
    await page.goto(path);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main .loading-state')).toBeVisible();
    await expectAccessible(page);
    release?.();
    await expect(page.locator('main [role="alert"]')).toBeVisible();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expectAccessible(page);
  });
}

test('reflow à 400 %, texte à 200 % et mouvement réduit', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // 1280 CSS pixels at 400% browser zoom leave a 320 CSS pixel viewport.
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of [
    '/',
    '/artisans/alimentation',
    '/artisan/chocolaterie-labbe',
  ]) {
    await page.goto(path);
    await expect(page.locator('.loading-state')).toHaveCount(0);
    await expectAccessible(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const readableColumn = page
      .locator('.artisan-profile__summary, .artisan-card')
      .first();
    const box = await readableColumn.boundingBox();
    expect(
      box?.width,
      'Le texte agrandi doit conserver une colonne lisible',
    ).toBeGreaterThan(400);
    await page.screenshot({
      path: testInfo.outputPath(
        `${path.replaceAll('/', '_') || 'home'}-text-200.png`,
      ),
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 800 });
  }
  await page.goto('/');
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe('auto');
});
