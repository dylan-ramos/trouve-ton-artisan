import { DataTypes, Model, Sequelize } from 'sequelize';
import type {
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { Specialty } from '../specialties/specialty.model.js';

export class Artisan extends Model<
  InferAttributes<Artisan>,
  InferCreationAttributes<Artisan>
> {
  declare id: CreationOptional<number>;
  declare specialtyId: ForeignKey<Specialty['id']>;
  declare name: string;
  declare slug: string;
  declare rating: string;
  declare city: string;
  declare about: string;
  declare contactEmail?: string;
  declare websiteUrl: string | null;
  declare imageUrl: string | null;
  declare isFeatured: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare specialty?: NonAttribute<Specialty>;
}

export function initializeArtisanModel(sequelize: Sequelize): typeof Artisan {
  Artisan.init(
    {
      id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: 'uq_artisans_slug',
      },
      rating: { type: DataTypes.DECIMAL(2, 1), allowNull: false },
      city: { type: DataTypes.STRING(120), allowNull: false },
      about: { type: DataTypes.TEXT, allowNull: false },
      contactEmail: { type: DataTypes.STRING(254), allowNull: false },
      websiteUrl: { type: DataTypes.STRING(2048), allowNull: true },
      imageUrl: { type: DataTypes.STRING(2048), allowNull: true },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'artisans',
      modelName: 'Artisan',
      defaultScope: { attributes: { exclude: ['contactEmail'] } },
      scopes: {
        withContactEmail: { attributes: { include: ['contactEmail'] } },
      },
      indexes: [
        { fields: ['specialty_id'] },
        { fields: ['name'] },
        { fields: ['is_featured'] },
      ],
    },
  );

  return Artisan;
}
