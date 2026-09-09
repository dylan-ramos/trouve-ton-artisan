import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { test } from 'node:test';

import { parseEnvironment } from '../src/config/environment.js';
import { createMailTransport } from '../src/modules/contact/mail-transport.js';

const base = { DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'test' };
void test('exige un serveur SMTP en production et des identifiants complets', () => {
  assert.throws(
    () =>
      createMailTransport(
        parseEnvironment({ ...base, NODE_ENV: 'production' }),
      ),
    /SMTP_HOST/,
  );
  assert.throws(
    () =>
      createMailTransport(
        parseEnvironment({
          ...base,
          SMTP_HOST: 'smtp.example',
          SMTP_USER: 'user',
        }),
      ),
    /SMTP_USER/,
  );
});

void test('refuse de transmettre un message en production si STARTTLS est absent', async () => {
  const commands: string[] = [];
  const server = createServer((socket) => {
    socket.write('220 localhost audit SMTP\r\n');
    socket.on('data', (data: Buffer) => {
      const command = data.toString('utf8');
      commands.push(command);
      if (command.startsWith('EHLO')) socket.write('250 localhost\r\n');
      else socket.write('454 TLS unavailable\r\n');
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const transport = createMailTransport(
      parseEnvironment({
        ...base,
        NODE_ENV: 'production',
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: String(address.port),
      }),
    );
    await assert.rejects(
      transport.sendMail({
        from: 'audit@example.com',
        to: 'recipient@example.com',
        replyTo: 'visitor@example.com',
        subject: 'Audit',
        text: 'Must never be transmitted',
        html: '<p>Must never be transmitted</p>',
      }),
      /STARTTLS/,
    );
    assert.ok(commands.some((command) => command.startsWith('STARTTLS')));
    assert.ok(
      commands.every(
        (command) => !/MAIL FROM|RCPT TO|DATA|Must never/.test(command),
      ),
    );
  } finally {
    server.close();
    await once(server, 'close');
  }
});
