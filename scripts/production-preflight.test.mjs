import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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

test('le CLI lit la configuration sur stdin sans Docker et ne révèle pas les secrets', () => {
  const run = input => spawnSync(process.execPath, [fileURLToPath(new URL('./production-preflight.mjs', import.meta.url))], { input, encoding: 'utf8' });
  const valid = run(JSON.stringify(fixture()));
  assert.equal(valid.status, 0);
  assert.doesNotMatch(valid.stdout + valid.stderr, /fixture-app-password|fixture-root-password|local-fixture-password/);
  for (const input of ['', '{invalid', '{}']) {
    const invalid = run(input);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Impossible de vérifier/);
  }
});
