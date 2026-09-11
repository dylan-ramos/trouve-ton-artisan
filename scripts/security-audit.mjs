import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5180';
const composeArgs = ['compose', '--env-file', '.env', ...(existsSync('.env.local') ? ['--env-file', '.env.local'] : [])];
const auditArgs = [...composeArgs, '--project-name', process.env.AUDIT_PROJECT_NAME ?? 'trouve-ton-artisan-audit', '-f', 'compose.yaml', '-f', 'compose.audit.yaml'];
const docker = (args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const checks = [];
function passed(name) { checks.push(name); console.log(`OK ${name}`); }

for (const mode of [['production', ['-f', 'compose.yaml']], ['development', ['-f', 'compose.yaml', '-f', 'compose.dev.yaml']]]) {
  const config = JSON.parse(docker([...composeArgs, ...mode[1], 'config', '--format', 'json']));
  for (const service of ['backend', 'database']) assert.equal(config.services[service].ports, undefined);
  assert.equal(config.networks.database.internal, true);
  assert.equal(config.services.backend.networks.proxy, undefined);
  assert.equal(config.services.database.networks.proxy, undefined);
  assert.ok(Object.hasOwn(config.services.backend.networks, 'egress'));
  if (mode[0] === 'development') assert.equal(config.services.frontend.networks.proxy, undefined);
  passed(`${mode[0]}: aucun port backend/MySQL, réseau base privé et sortie SMTP séparée`);
}
for (const path of ['/', '/mentions-legales', '/adresse-inconnue', '/assets/logo.png', '/missing.js', '/api/health', '/.env']) {
  const response = await fetch(new URL(path, baseUrl));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(response.headers.get('permissions-policy'), /camera=\(\)/);
  const csp = response.headers.get('content-security-policy');
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  assert.equal(response.headers.get('strict-transport-security'), null);
  assert.equal(response.headers.get('x-powered-by'), null);
  if (path === '/missing.js') assert.equal(response.status, 404);
  if (path === '/.env') assert.equal(response.status, 403);
  passed(`en-têtes de sécurité sur ${path} (${response.status})`);
}
const spoof = await fetch(new URL('/api/health', baseUrl), { headers: { 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': '203.0.113.1' } });
assert.equal(spoof.headers.get('strict-transport-security'), null);
passed('un pair non approuvé ne peut pas imposer HTTPS via un en-tête');
// wget writes headers to stderr; use an explicit capture for the trusted peer.
const trustedHeaders = execFileSync('docker', [...auditArgs, 'exec', '-T', 'frontend', 'sh', '-c', 'wget -S -O /dev/null --header="X-Forwarded-Proto: https" http://127.0.0.1:8080/api/health 2>&1'], { encoding: 'utf8' });
assert.match(trustedHeaders.toLowerCase(), /strict-transport-security: max-age=31536000/);
passed('HSTS uniquement quand le pair de confiance déclare HTTPS');
const list = await (await fetch(new URL('/api/artisans?limit=50', baseUrl))).json();
assert.equal(list.data.length, 17);
assert.doesNotMatch(JSON.stringify(list), /contact_?email|@[a-z0-9.-]+\.[a-z]{2,}/i);
passed('17 artisans sans adresse e-mail publique');
const body = { name: 'Audit', email: 'audit@example.com', subject: 'Audit contact', message: 'Message de contrôle sans livraison.', website: 'honeypot' };
for (let index = 0; index < 6; index++) {
  const response = await fetch(new URL('/api/artisans/chocolaterie-labbe/contact', baseUrl), {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `203.0.113.${index + 1}` }, body: JSON.stringify(body),
  });
  assert.equal(response.status, index < 5 ? 202 : 429);
}
passed('quota de contact non contournable par X-Forwarded-For externe (aucun e-mail envoyé)');
for (const [service, user] of [['frontend', '101'], ['backend', 'node']]) {
  const id = docker([...auditArgs, 'ps', '-q', service]).trim();
  const inspected = JSON.parse(docker(['inspect', id]))[0];
  assert.equal(inspected.Config.User, user);
  assert.ok(inspected.HostConfig.CapDrop.includes('ALL'));
  assert.ok(inspected.HostConfig.SecurityOpt.includes('no-new-privileges:true'));
  passed(`${service}: utilisateur ${user}, capacités supprimées et no-new-privileges`);
}
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
assert.equal(tracked.some((path) => /(^|\/)\.env.*\.local$/.test(path)), false);
for (const path of tracked) {
  if (!/\.(?:[cm]?[jt]sx?|ya?ml|json|md|sql|conf)$|(^|\/)\.env$/.test(path) || !existsSync(path)) continue;
  assert.doesNotMatch(readFileSync(path, 'utf8'), /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}/, `Secret détecté : ${path}`);
}
passed('aucun fichier .env.local suivi ni signature de clé privée/token détectée');
mkdirSync('frontend/audit-results', { recursive: true });
writeFileSync('frontend/audit-results/security.json', JSON.stringify({ date: new Date().toISOString(), checks }, null, 2));
