import express, { type ErrorRequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { ApiError } from './http/api-error.js';
import { createApiRouter } from './modules/api.routes.js';
import type { ArtisanService } from './modules/artisans/artisan.service.js';
import type { CategoryService } from './modules/categories/category.service.js';

import {
  createHealthRouter,
  type DatabaseHealthCheck,
} from './modules/health/health.routes.js';

export interface ApplicationDependencies {
  checkDatabase: DatabaseHealthCheck;
  isProduction: boolean;
  artisanService?: ArtisanService;
  categoryService?: CategoryService;
}

export function createApplication({
  checkDatabase,
  isProduction,
  artisanService,
  categoryService,
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
  if (artisanService && categoryService) {
    application.use(
      rateLimit({
        windowMs: 60_000,
        limit: 120,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
          error: {
            status: 429,
            message: 'Trop de requêtes. Veuillez réessayer dans un instant.',
          },
        },
      }),
    );
    application.use(createApiRouter(categoryService, artisanService));
  }

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
    if (error instanceof ApiError) {
      response
        .status(error.status)
        .json({ error: { status: error.status, message: error.message } });
      return;
    }
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
