import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseEnvironment } from '../src/config/environment.js';

const valid = {
  DB_NAME: 'artisan_test',
  DB_USER: 'test_user',
  DB_PASSWORD: 'test-only-password',
};

void test('interprète explicitement le mode TLS et les ports fournis par environnement', () => {
  const environment = parseEnvironment({
    ...valid,
    NODE_ENV: 'production',
    PORT: '3100',
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
  });
  assert.equal(environment.PORT, 3100);
  assert.equal(environment.SMTP_PORT, 465);
  assert.equal(environment.SMTP_SECURE, true);
  assert.equal(
    parseEnvironment({ ...valid, SMTP_SECURE: 'false' }).SMTP_SECURE,
    false,
  );
});

void test('refuse les identifiants absents et les paramètres de démarrage invalides', () => {
  for (const invalid of [
    { DB_PASSWORD: '' },
    { DB_NAME: ' ' },
    { DB_USER: '' },
    { PORT: '0' },
    { DB_PORT: '65536' },
    { SMTP_PORT: 'abc' },
    { SMTP_SECURE: 'yes' },
    { SMTP_FROM: 'invalid' },
    { SMTP_TEST_RECIPIENT: 'invalid' },
    { SMTP_TEST_RECIPIENT: 'one@example.com,two@example.com' },
    { SMTP_TEST_RECIPIENT: 'one@example.com\r\nBcc: two@example.com' },
    { NODE_ENV: 'unknown' },
  ])
    assert.throws(() => parseEnvironment({ ...valid, ...invalid }));
  assert.throws(() => parseEnvironment({}));
});
