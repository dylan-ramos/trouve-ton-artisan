import { createDatabase } from '../config/database.js';
import { parseEnvironment } from '../config/environment.js';
import { initializeModels } from '../models.js';

const EXPECTED_COUNTS = {
  categories: 4,
  specialties: 15,
  artisans: 17,
  featured: 3,
} as const;
const environment = parseEnvironment();
const database = createDatabase(environment);
const models = initializeModels(database);

try {
  await database.authenticate();
  const [categories, specialties, artisans, featured] = await Promise.all([
    models.Category.count(),
    models.Specialty.count(),
    models.Artisan.count(),
    models.Artisan.count({ where: { isFeatured: true } }),
  ]);
  const counts = { categories, specialties, artisans, featured };

  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[key as keyof typeof counts] !== expected) {
      throw new Error(
        `Comptage ${key} invalide : ${String(counts[key as keyof typeof counts])}/${String(expected)}.`,
      );
    }
  }

  console.info(
    'Base validée : 4 catégories, 15 spécialités, 17 artisans et 3 vedettes.',
  );
} finally {
  await database.close();
}
