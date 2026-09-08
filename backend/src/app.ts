import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';

import {
  createHealthRouter,
  type DatabaseHealthCheck,
} from './modules/health/health.routes.js';

export interface ApplicationDependencies {
  checkDatabase: DatabaseHealthCheck;
  isProduction: boolean;
}

export function createApplication({
  checkDatabase,
  isProduction,
}: ApplicationDependencies) {
  const application = express();

  if (isProduction) {
    application.set('trust proxy', 1);
  }

  application.disable('x-powered-by');
  application.use(helmet());
  application.use(express.json({ limit: '32kb' }));
  application.use(express.urlencoded({ extended: false, limit: '32kb' }));

  application.use('/health', createHealthRouter(checkDatabase));

  application.use((_request, response) => {
    response
      .status(404)
      .json({ error: { status: 404, message: 'Ressource introuvable.' } });
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    if (!isProduction) {
      console.error(error);
    }
    response.status(500).json({
      error: { status: 500, message: 'Une erreur interne est survenue.' },
    });
  };
  application.use(errorHandler);

  return application;
}
