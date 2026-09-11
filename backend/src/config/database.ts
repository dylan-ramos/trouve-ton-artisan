import { Sequelize } from 'sequelize';

import type { Environment } from './environment.js';

export function createDatabase(environment: Environment): Sequelize {
  return new Sequelize(
    environment.DB_NAME,
    environment.DB_USER,
    environment.DB_PASSWORD,
    {
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      dialect: 'mysql',
      logging: false,
      define: {
        underscored: true,
        freezeTableName: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 10_000,
        idle: 10_000,
      },
    },
  );
}
