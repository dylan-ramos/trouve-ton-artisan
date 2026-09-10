import assert from 'node:assert/strict';
import { test } from 'node:test';
import { productionIssues } from './production-preflight.mjs';
const fixture = () => ({ services: {
  frontend: { build: { args: { VITE_SITE_URL: 'https://artisan.test' } }, labels: { 'traefik.http.routers.artisan.rule': 'Host(`artisan.test`)' }, environment: { TRAEFIK_TRUSTED_IP: '172.20.0.2' } },
  backend: { environment: { SMTP_HOST: 'smtp.artisan.test', SMTP_USER: 'local-fixture', SMTP_PASSWORD: 'local-fixture-password' } },
  database: { environment: { MYSQL_PASSWORD: 'fixture-app-password', MYSQL_ROOT_PASSWORD: 'fixture-root-password' } },
} });
test('accepte une configuration cohérente sans en afficher les secrets', () => { assert.deepEqual(productionIssues(fixture()), []); });
test('refuse les valeurs de démonstration avant tout déploiement', () => {
  const config = fixture();
  config.services.frontend.build.args.VITE_SITE_URL = 'http://localhost:5174';
  config.services.frontend.environment.TRAEFIK_TRUSTED_IP = '127.0.0.1';
  config.services.backend.environment.SMTP_HOST = 'smtp.invalid';
  config.services.database.environment.MYSQL_PASSWORD = 'replace-with-a-secure-password';
  assert.equal(productionIssues(config).length, 5);
});
test('refuse domaine incohérent, mot de passe root partagé et compte SMTP incomplet', () => {
  const config = fixture();
  config.services.frontend.labels['traefik.http.routers.artisan.rule'] = 'Host(`autre.test`)';
  delete config.services.backend.environment.SMTP_PASSWORD;
  config.services.database.environment.MYSQL_ROOT_PASSWORD = config.services.database.environment.MYSQL_PASSWORD;
  assert.equal(productionIssues(config).length, 3);
});
