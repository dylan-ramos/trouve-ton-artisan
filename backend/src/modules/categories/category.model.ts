import { DataTypes, Model, Sequelize } from 'sequelize';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { Specialty } from '../specialties/specialty.model.js';

export class Category extends Model<
  InferAttributes<Category>,
  InferCreationAttributes<Category>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare slug: string;
  declare displayOrder: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare specialties?: NonAttribute<Specialty[]>;
}

export function initializeCategoryModel(sequelize: Sequelize): typeof Category {
  Category.init(
    {
      id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: 'uq_categories_name',
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: 'uq_categories_slug',
      },
      displayOrder: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'categories',
      modelName: 'Category',
      indexes: [{ fields: ['display_order'] }],
    },
  );

  return Category;
}
