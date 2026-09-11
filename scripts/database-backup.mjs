import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

// The supplied dataset is small; bound memory instead of leaving plaintext on disk.
const limit = 64 * 1024 * 1024;
function run(command, args, input) {
  try {
    return execFileSync(command, args, { input, maxBuffer: limit, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    throw new Error(`${command} a échoué ; sortie privée masquée.`);
  }
}
const base = ['compose', '--env-file', '.env', ...(existsSync('.env.local') ? ['--env-file', '.env.local'] : [])];
const config = JSON.parse(run('docker', [...base, '-f', 'compose.yaml', 'config', '--format', 'json']));
const project = config.name;
const gpg = ['--batch', ...(process.env.BACKUP_GPG_HOME ? ['--homedir', process.env.BACKUP_GPG_HOME] : [])];
const dumpCommand = 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --user="$MYSQL_USER" --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF --skip-comments --skip-add-locks --skip-extended-insert --order-by-primary "$MYSQL_DATABASE"';
const digest = (data) => createHash('sha256').update(data).digest('hex');
const [action, file, mode = 'production'] = process.argv.slice(2);
try {
  assert.ok(file, 'Indiquer un fichier de sauvegarde.');
  if (action === 'backup') {
    assert.ok(['production', 'development', 'audit'].includes(mode), 'Mode invalide.');
    assert.match(process.env.BACKUP_RECIPIENT ?? '', /^(?:[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})$/, 'BACKUP_RECIPIENT doit être une empreinte GPG complète vérifiée.');
    const args = mode === 'audit'
      ? [...base, '--project-name', `${project}-audit`, '-f', 'compose.yaml', '-f', 'compose.audit.yaml']
      : [...base, '-f', 'compose.yaml', ...(mode === 'development' ? ['-f', 'compose.dev.yaml'] : [])];
    const dump = run('docker', [...args, 'exec', '-T', 'database', 'sh', '-c', dumpCommand]);
    assert.ok(dump.length > 0, 'Sauvegarde vide refusée.');
    const encrypted = run('gpg', [...gpg, '--trust-model', 'always', '--encrypt', '--recipient', process.env.BACKUP_RECIPIENT, '--output', '-'], gzipSync(dump));
    writeFileSync(file, encrypted, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ action, encryptedBytes: encrypted.length, sha256: digest(encrypted) }));
  } else if (action === 'restore-check') {
    // Decrypt and authenticate completely before starting a database or executing SQL.
    assert.ok(statSync(file).size <= limit, 'Archive trop volumineuse pour cet outil.');
    const dump = gunzipSync(run('gpg', [...gpg, '--decrypt', '--output', '-'], readFileSync(file)), { maxOutputLength: limit });
    process.env.RESTORE_DATABASE_IMAGE = config.services.database.image;
    const restore = [...base, '--project-name', `${project}-restore`, '-f', 'compose.restore.yaml'];
    const existing = run('docker', [...restore, 'ps', '-aq']).toString().trim();
    assert.equal(existing, '', 'Une pile de restauration existe déjà ; inspection manuelle nécessaire.');
    let started = false;
    try {
      started = true;
      run('docker', [...restore, 'up', '-d', '--wait']);
      const id = run('docker', [...restore, 'ps', '-q', 'database-restore']).toString().trim();
      const container = JSON.parse(run('docker', ['inspect', id]))[0];
      assert.equal(container.Config.Labels['com.docker.compose.project'], `${project}-restore`);
      assert.ok(Object.hasOwn(container.HostConfig.Tmpfs, '/var/lib/mysql'));
      assert.ok(!container.Mounts.some((mount) => mount.Destination === '/var/lib/mysql' && mount.Type !== 'tmpfs'));
      const mysqlCommand = 'test "$MYSQL_DATABASE" = trouve_ton_artisan_restore_test && MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --user="$MYSQL_USER" --batch --skip-column-names "$MYSQL_DATABASE"';
      const mysql = (sql) => run('docker', [...restore, 'exec', '-T', 'database-restore', 'sh', '-c', mysqlCommand], sql);
      assert.equal(mysql('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE();').toString().trim(), '0');
      mysql(dump);
      const restored = run('docker', [...restore, 'exec', '-T', 'database-restore', 'sh', '-c', dumpCommand]);
      assert.equal(digest(restored), digest(dump), 'Le dump restauré diffère de la sauvegarde.');
      console.log(JSON.stringify({ action, identicalDump: true, plaintextSha256: digest(dump) }));
    } finally {
      if (started) run('docker', [...restore, 'down', '--remove-orphans']);
    }
  } else throw new Error('Utiliser backup ou restore-check.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
