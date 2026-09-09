import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import { createApplication } from '../src/app.js';
import { initializeModels } from '../src/models.js';
import { ArtisanService } from '../src/modules/artisans/artisan.service.js';
import { CategoryService } from '../src/modules/categories/category.service.js';
import { ContactService } from '../src/modules/contact/contact.service.js';

// No connection is opened: these requests must fail before reaching persistence.
const models = initializeModels(
  new Sequelize('test', 'test', 'test', {
    dialect: 'mysql',
    logging: false,
  }),
);
const artisanService = new ArtisanService(models);
function application(isProduction = true) {
  return createApplication({
    checkDatabase: () => Promise.resolve(),
    isProduction,
    artisanService,
    categoryService: new CategoryService(models),
    contactService: new ContactService(
      artisanService,
      {
        sendMail() {
          throw new Error('No message should be sent.');
        },
      },
      'test@example.com',
    ),
  });
}
const contactUrl = '/artisans/chocolaterie-labbe/contact';
const valid = {
  name: 'Visiteur',
  email: 'visitor@example.com',
  subject: 'Demande de tarif',
  message: 'Bonjour, je souhaite un devis.',
  website: '',
};

void describe('sécurité HTTP', () => {
  void test('retourne 400 pour un JSON malformé sans exposer son corps', async () => {
    const response = await request(application())
      .post(contactUrl)
      .set('Content-Type', 'application/json')
      .send('{"secret":')
      .expect(400);
    assert.deepEqual(response.body, {
      error: { status: 400, message: 'Corps JSON invalide.' },
    });
    assert.doesNotMatch(response.text, /secret|SyntaxError|stack/);
  });
  void test('borne les corps et refuse les corps compressés', async () => {
    await request(application())
      .post(contactUrl)
      .send({ ...valid, message: 'x'.repeat(33_000) })
      .expect(413);
    await request(application())
      .post(contactUrl)
      .set('Content-Encoding', 'gzip')
      .send(valid)
      .expect(415);
  });
  void test('refuse les formulaires cross-site et les formats simples sans CORS', async () => {
    const app = application();
    await request(app).post(contactUrl).type('form').send(valid).expect(415);
    await request(app)
      .post(contactUrl)
      .set('Sec-Fetch-Site', 'cross-site')
      .send(valid)
      .expect(403);
    const response = await request(app)
      .options(contactUrl)
      .set('Origin', 'https://other.example');
    assert.equal(response.headers['access-control-allow-origin'], undefined);
  });
  void test('refuse les caractères de contrôle même aux extrémités des en-têtes SMTP', async () => {
    for (const [field, value] of [
      ['subject', '\r\nDemande'],
      ['name', 'Visiteur\n'],
      ['email', 'visitor@example.com\r\n'],
    ] as const) {
      await request(application())
        .post(contactUrl)
        .send({ ...valid, [field]: value })
        .expect(422);
    }
  });
  void test('borne les pages avant toute requête SQL', async () => {
    await request(application()).get('/artisans?page=10001').expect(422);
    await request(application())
      .get('/artisans?page=9007199254740992')
      .expect(422);
  });
  void test('ne permet pas de contourner le quota avec un préfixe X-Forwarded-For forgé', async () => {
    const app = application();
    for (let index = 0; index < 6; index++) {
      await request(app)
        .post(contactUrl)
        .set('X-Forwarded-For', `203.0.113.${String(index + 1)}, 198.51.100.42`)
        .send({ ...valid, website: 'honeypot' })
        .expect(index < 5 ? 202 : 429);
    }
    await request(app)
      .post(contactUrl)
      .set('X-Forwarded-For', '198.51.100.43')
      .send({ ...valid, website: 'honeypot' })
      .expect(202);
    await request(app).get('/health').expect(200);
  });
  void test('ignore les en-têtes client en développement et garde le healthcheck hors quota', async () => {
    const app = application(false);
    for (let index = 0; index < 6; index++) {
      await request(app)
        .post(contactUrl)
        .set('X-Forwarded-For', `203.0.113.${String(index + 1)}`)
        .send({ ...valid, website: 'honeypot' })
        .expect(index < 5 ? 202 : 429);
    }
    await request(app).get('/health').expect(200);
  });
  void test('protège les réponses publiques et laisse HSTS au terminateur HTTPS', async () => {
    const response = await request(application()).get('/health').expect(200);
    assert.equal(response.headers['x-powered-by'], undefined);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.match(String(response.headers['permissions-policy']), /camera=\(\)/);
    assert.equal(response.headers['strict-transport-security'], undefined);
  });
});
