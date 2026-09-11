import { createApplication } from './app.js';
import { createDatabase } from './config/database.js';
import { parseEnvironment } from './config/environment.js';
import { initializeModels } from './models.js';
import { ArtisanService } from './modules/artisans/artisan.service.js';
import { CategoryService } from './modules/categories/category.service.js';
import { ContactService } from './modules/contact/contact.service.js';
import { createMailTransport } from './modules/contact/mail-transport.js';

const environment = parseEnvironment();
const database = createDatabase(environment);
const models = initializeModels(database);
const artisanService = new ArtisanService(models);
const application = createApplication({
  checkDatabase: async () => database.authenticate(),
  isProduction: environment.NODE_ENV === 'production',
  artisanService,
  categoryService: new CategoryService(models),
  contactService: new ContactService(
    artisanService,
    createMailTransport(environment),
    environment.SMTP_FROM,
  ),
});

const server = application.listen(environment.PORT, '0.0.0.0', () => {
  console.info(`API disponible sur le port ${String(environment.PORT)}.`);
});

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`${signal} reçu, arrêt en cours.`);

  server.close(() => {
    void database
      .close()
      .then(() => {
        process.exitCode = 0;
      })
      .catch((error: unknown) => {
        console.error('La fermeture de la base a échoué.', error);
        process.exitCode = 1;
      });
  });

  setTimeout(() => {
    console.error("Délai maximal d'arrêt dépassé.");
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});
