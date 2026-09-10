import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';

export function productionIssues(config) {
  const issues = [];
  const backend = config.services.backend.environment;
  const frontend = config.services.frontend;
  const database = config.services.database.environment;
  const placeholder = value => !value || /replace-with|example\.(com|org|net)|\.invalid$|localhost/i.test(value);
  const site = frontend.build.args.VITE_SITE_URL;
  try {
    const url = new URL(site);
    if (url.protocol !== 'https:' || placeholder(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) issues.push('SITE_URL doit être une origine HTTPS publique réelle.');
    const rule = Object.entries(frontend.labels).find(([key]) => key.endsWith('.rule'))?.[1];
    if (rule !== `Host(\`${url.hostname}\`)`) issues.push('TRAEFIK_HOST doit correspondre à SITE_URL.');
  } catch { issues.push('SITE_URL invalide.'); }
  const trusted = frontend.environment.TRAEFIK_TRUSTED_IP;
  if (!isIP(trusted ?? '') || trusted === '127.0.0.1' || trusted === '::1' || trusted === '0.0.0.0' || trusted === '::') issues.push('Définir l’adresse IP exacte de Traefik.');
  if (placeholder(backend.SMTP_HOST)) issues.push('Définir un serveur SMTP réel.');
  if (Boolean(backend.SMTP_USER) !== Boolean(backend.SMTP_PASSWORD)) issues.push('Les identifiants SMTP doivent être fournis ensemble.');
  if ([database.MYSQL_PASSWORD, database.MYSQL_ROOT_PASSWORD].some(placeholder)) issues.push('Remplacer les mots de passe MySQL d’exemple.');
  if (database.MYSQL_PASSWORD === database.MYSQL_ROOT_PASSWORD) issues.push('Utiliser deux mots de passe MySQL distincts.');
  return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = ['compose', '--env-file', '.env', ...(existsSync('.env.local') ? ['--env-file', '.env.local'] : []), '-f', 'compose.yaml', 'config', '--format', 'json'];
    const config = JSON.parse(execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    const issues = productionIssues(config);
    if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
    else console.log('Configuration de production prête pour la recette externe.');
  } catch { console.error('Impossible de vérifier la configuration de production.'); process.exitCode = 1; }
}
