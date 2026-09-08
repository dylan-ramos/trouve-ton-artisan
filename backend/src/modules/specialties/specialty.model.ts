import { DataTypes, Model, Sequelize } from 'sequelize';
import type {
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { Artisan } from '../artisans/artisan.model.js';
import type { Category } from '../categories/category.model.js';

export class Specialty extends Model<
  InferAttributes<Specialty>,
  InferCreationAttributes<Specialty>
> {
  declare id: CreationOptional<number>;
  declare categoryId: ForeignKey<Category['id']>;
  declare name: string;
  declare slug: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare category?: NonAttribute<Category>;
  declare artisans?: NonAttribute<Artisan[]>;
}

export function initializeSpecialtyModel(
  sequelize: Sequelize,
): typeof Specialty {
  Specialty.init(
    {
      id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: 'uq_specialties_slug',
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'specialties',
      modelName: 'Specialty',
      indexes: [
        { unique: true, fields: ['category_id', 'name'] },
        { fields: ['category_id'] },
      ],
    },
  );

  return Specialty;
}
