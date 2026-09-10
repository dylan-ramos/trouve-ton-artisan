import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import type { Sequelize } from 'sequelize';
import request from 'supertest';
import { z } from 'zod';

import { createApplication } from '../src/app.js';
import { createDatabase } from '../src/config/database.js';
import { parseEnvironment } from '../src/config/environment.js';
import { initializeModels, type ApplicationModels } from '../src/models.js';
import { ArtisanService } from '../src/modules/artisans/artisan.service.js';
import { CategoryService } from '../src/modules/categories/category.service.js';
import { ContactService } from '../src/modules/contact/contact.service.js';
import type { MailMessage } from '../src/modules/contact/mail-transport.js';

const integrationEnabled = process.env.INTEGRATION_TEST === 'true';
let database: Sequelize;
let models: ApplicationModels;

void describe('persistance Sequelize', { skip: !integrationEnabled }, () => {
  before(async () => {
    const environment = parseEnvironment();
    assert.equal(
      environment.NODE_ENV,
      'test',
      'Les tests d’intégration exigent NODE_ENV=test.',
    );
    assert.match(
      environment.DB_NAME,
      /_test$/,
      'Le nom de la base de test doit finir par _test.',
    );

    database = createDatabase(environment);
    models = initializeModels(database);
    await database.authenticate();
  });

  after(async () => database.close());

  void test('charge le jeu de données complet', async () => {
    const [categories, specialties, artisans, featured] = await Promise.all([
      models.Category.count(),
      models.Specialty.count(),
      models.Artisan.count(),
      models.Artisan.count({ where: { isFeatured: true } }),
    ]);

    assert.deepEqual(
      { categories, specialties, artisans, featured },
      {
        categories: 4,
        specialties: 15,
        artisans: 17,
        featured: 3,
      },
    );
  });

  void test('charge les associations catégorie, spécialité et artisan', async () => {
    const category = await new CategoryService(models).findBySlug('services');
    assert.ok(category);
    assert.ok(category.specialties);
    assert.equal(category.specialties.length, 4);

    const artisan = await new ArtisanService(models).findBySlug('cm-graphisme');
    assert.ok(artisan);
    assert.ok(artisan.specialty);
    assert.ok(artisan.specialty.category);
    assert.equal(artisan.specialty.name, 'Webdesign');
    assert.equal(artisan.specialty.category.name, 'Services');
  });

  void test('retourne trois vedettes ordonnées sans adresse de contact', async () => {
    const featured = await new ArtisanService(models).listFeatured();
    assert.deepEqual(
      featured.map((artisan) => artisan.name),
      ['Orville Salmons', 'Chocolaterie Labbé', 'Au pain chaud'],
    );
    assert.ok(
      featured.every((artisan) => artisan.get('contactEmail') === undefined),
    );
    assert.ok(
      featured.every((artisan) => !('contactEmail' in artisan.toJSON())),
    );
  });

  void test('permet un accès explicite à l’adresse pour le futur service de contact', async () => {
    const artisan = await models.Artisan.scope('withContactEmail').findOne({
      where: { slug: 'chocolaterie-labbe' },
    });
    assert.equal(artisan?.contactEmail, 'chocolaterie-labbe@gmail.com');
  });

  void test('expose les ressources publiques sans adresse de contact', async () => {
    const application = createApplication({
      checkDatabase: () => database.authenticate(),
      isProduction: true,
      artisanService: new ArtisanService(models),
      categoryService: new CategoryService(models),
    });
    const categories = z
      .object({ data: z.array(z.unknown()) })
      .parse((await request(application).get('/categories').expect(200)).body);
    assert.equal(categories.data.length, 4);

    const featured = z
      .object({ data: z.array(z.record(z.string(), z.unknown())) })
      .parse(
        (await request(application).get('/artisans/featured').expect(200)).body,
      );
    assert.equal(featured.data.length, 3);
    assert.ok(featured.data.every((artisan) => !('contactEmail' in artisan)));

    const listSchema = z.object({
      data: z.array(z.object({ name: z.string() })),
      meta: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    });
    const search = listSchema.parse(
      (
        await request(application)
          .get('/artisans')
          .query({ search: 'Labbé' })
          .expect(200)
      ).body,
    );
    assert.equal(search.data[0]?.name, 'Chocolaterie Labbé');
    assert.deepEqual(search.meta, {
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    const empty = listSchema.parse(
      (
        await request(application)
          .get('/artisans')
          .query({ search: 'introuvable' })
          .expect(200)
      ).body,
    );
    assert.equal(empty.data.length, 0);
    await request(application).get('/categories/inconnue/artisans').expect(404);
    await request(application).get('/artisans/inconnu').expect(404);
    await request(application)
      .get('/artisans')
      .query({ limit: 500 })
      .expect(422);
    await request(application)
      .get('/artisans')
      .query({ unexpected: 'value' })
      .expect(422);
  });

  void test('recherche sans accents et traite les caractères LIKE comme du texte', async () => {
    const service = new ArtisanService(models);
    const result = await service.search({
      search: 'labbe',
      page: 1,
      limit: 12,
    });
    assert.equal(result.data[0]?.name, 'Chocolaterie Labbé');
    for (const search of ['%', '_', "' OR 1=1 --"]) {
      const empty = await service.search({ search, page: 1, limit: 12 });
      assert.equal(empty.meta.total, 0);
      assert.deepEqual(empty.data, []);
    }
  });

  void test('pagine sans doublon et combine catégorie et recherche', async () => {
    const service = new ArtisanService(models);
    const first = await service.search({ page: 1, limit: 12 });
    const second = await service.search({ page: 2, limit: 12 });
    assert.equal(first.data.length, 12);
    assert.equal(second.data.length, 5);
    assert.equal(
      new Set([...first.data, ...second.data].map(({ id }) => id)).size,
      17,
    );
    assert.deepEqual(second.meta, {
      page: 2,
      limit: 12,
      total: 17,
      totalPages: 2,
    });
    const beyond = await service.search({ page: 3, limit: 12 });
    assert.deepEqual(beyond.data, []);
    const filtered = await service.search({
      category: 'alimentation',
      search: 'labbe',
      page: 1,
      limit: 12,
    });
    assert.equal(filtered.meta.total, 1);
    const excluded = await service.search({
      category: 'batiment',
      search: 'labbe',
      page: 1,
      limit: 12,
    });
    assert.equal(excluded.meta.total, 0);
  });

  void test('transmet un contact sûr sans révéler le destinataire', async () => {
    const messages: MailMessage[] = [];
    const artisanService = new ArtisanService(models);
    const application = createApplication({
      checkDatabase: () => database.authenticate(),
      isProduction: true,
      artisanService,
      categoryService: new CategoryService(models),
      contactService: new ContactService(
        artisanService,
        {
          sendMail(message) {
            messages.push(message);
            return Promise.resolve();
          },
        },
        'no-reply@trouve-ton-artisan.fr',
      ),
    });
    const validContact = {
      name: '<Dylan>',
      email: 'dylan@example.com',
      subject: 'Demande de tarif',
      message: 'Bonjour, je souhaite recevoir un tarif.',
      website: '',
    };
    const success = await request(application)
      .post('/artisans/chocolaterie-labbe/contact')
      .send(validContact)
      .expect(202);
    assert.deepEqual(success.body, { data: { message: 'Message envoyé.' } });
    assert.doesNotMatch(success.text, /chocolaterie-labbe@gmail.com/);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.to, 'chocolaterie-labbe@gmail.com');
    assert.match(messages[0].html, /&lt;Dylan&gt;/);
    assert.doesNotMatch(messages[0].html, /<Dylan>/);

    await request(application)
      .post('/artisans/chocolaterie-labbe/contact')
      .send({ ...validContact, website: 'https://spam.example' })
      .expect(202);
    assert.equal(messages.length, 1);
    await request(application)
      .post('/artisans/chocolaterie-labbe/contact')
      .send({ ...validContact, subject: 'Copie\r\nBcc: target@example.com' })
      .expect(422);
    await request(application)
      .post('/artisans/chocolaterie-labbe/contact')
      .send({ ...validContact, email: 'invalide' })
      .expect(422);
    await request(application)
      .post('/artisans/artisan-inconnu/contact')
      .send(validContact)
      .expect(404);
    await request(application)
      .post('/artisans/chocolaterie-labbe/contact')
      .send(validContact)
      .expect(429);
    assert.equal(messages.length, 1);
  });

  void test('retourne une erreur neutre lors d’une panne SMTP', async () => {
    const artisanService = new ArtisanService(models);
    const application = createApplication({
      checkDatabase: () => database.authenticate(),
      isProduction: true,
      artisanService,
      categoryService: new CategoryService(models),
      contactService: new ContactService(
        artisanService,
        { sendMail: () => Promise.reject(new Error('smtp secret detail')) },
        'no-reply@trouve-ton-artisan.fr',
      ),
    });
    const response = await request(application)
      .post('/artisans/chocolaterie-labbe/contact')
      .send({
        name: 'Dylan Martin',
        email: 'dylan@example.com',
        subject: 'Demande de tarif',
        message: 'Bonjour, je souhaite recevoir un tarif.',
        website: '',
      })
      .expect(503);
    assert.doesNotMatch(response.text, /smtp secret detail|gmail\.com/);
  });
});
