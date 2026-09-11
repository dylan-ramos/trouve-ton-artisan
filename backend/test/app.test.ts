import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import request from 'supertest';

import { createApplication } from '../src/app.js';

void describe('application HTTP', () => {
  void test('indique que l’API et la base sont disponibles', async () => {
    const application = createApplication({
      checkDatabase: () => Promise.resolve(),
      isProduction: false,
    });
    const response = await request(application).get('/health').expect(200);
    assert.deepEqual(response.body, { status: 'ok', database: 'connected' });
  });

  void test('signale une base indisponible sans exposer son erreur', async () => {
    const application = createApplication({
      checkDatabase: () => Promise.reject(new Error('secret database detail')),
      isProduction: true,
    });
    const response = await request(application).get('/health').expect(503);
    assert.deepEqual(response.body, {
      status: 'unavailable',
      database: 'disconnected',
    });
    assert.doesNotMatch(response.text, /secret database detail/);
  });

  void test('retourne une erreur JSON stable pour une route inconnue', async () => {
    const application = createApplication({
      checkDatabase: () => Promise.resolve(),
      isProduction: true,
    });
    await request(application)
      .get('/unknown')
      .expect(404, {
        error: { status: 404, message: 'Ressource introuvable.' },
      });
  });
});
