import type { Sequelize } from 'sequelize';

import {
  Artisan,
  initializeArtisanModel,
} from './modules/artisans/artisan.model.js';
import {
  Category,
  initializeCategoryModel,
} from './modules/categories/category.model.js';
import {
  Specialty,
  initializeSpecialtyModel,
} from './modules/specialties/specialty.model.js';

export interface ApplicationModels {
  Artisan: typeof Artisan;
  Category: typeof Category;
  Specialty: typeof Specialty;
}

export function initializeModels(sequelize: Sequelize): ApplicationModels {
  initializeCategoryModel(sequelize);
  initializeSpecialtyModel(sequelize);
  initializeArtisanModel(sequelize);

  Category.hasMany(Specialty, { as: 'specialties', foreignKey: 'categoryId' });
  Specialty.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });
  Specialty.hasMany(Artisan, { as: 'artisans', foreignKey: 'specialtyId' });
  Artisan.belongsTo(Specialty, { as: 'specialty', foreignKey: 'specialtyId' });

  return { Artisan, Category, Specialty };
}
