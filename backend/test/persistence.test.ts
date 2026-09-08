import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import type { Sequelize } from 'sequelize';

import { createDatabase } from '../src/config/database.js';
import { parseEnvironment } from '../src/config/environment.js';
import { initializeModels, type ApplicationModels } from '../src/models.js';
import { ArtisanService } from '../src/modules/artisans/artisan.service.js';
import { CategoryService } from '../src/modules/categories/category.service.js';

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
});
