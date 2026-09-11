import express, { type ErrorRequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { ApiError } from './http/api-error.js';
import { createApiRouter } from './modules/api.routes.js';
import type { ArtisanService } from './modules/artisans/artisan.service.js';
import type { CategoryService } from './modules/categories/category.service.js';
import type { ContactService } from './modules/contact/contact.service.js';

import {
  createHealthRouter,
  type DatabaseHealthCheck,
} from './modules/health/health.routes.js';

export interface ApplicationDependencies {
  checkDatabase: DatabaseHealthCheck;
  isProduction: boolean;
  artisanService?: ArtisanService;
  categoryService?: CategoryService;
  contactService?: ContactService;
}

export function createApplication({
  checkDatabase,
  isProduction,
  artisanService,
  categoryService,
  contactService,
}: ApplicationDependencies) {
  const application = express();

  if (isProduction) {
    // Nginx overwrites forwarding headers; it is the sole public entry point.
    application.set('trust proxy', 1);
  } else {
    application.use((request, _response, next) => {
      delete request.headers['x-forwarded-for'];
      delete request.headers['x-forwarded-proto'];
      delete request.headers.forwarded;
      next();
    });
  }

  application.disable('x-powered-by');
  application.use(helmet({ strictTransportSecurity: false }));
  application.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

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
    application.use(express.json({ limit: '32kb', inflate: false }));
    application.use(
      createApiRouter(categoryService, artisanService, contactService),
    );
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
    // Body-parser errors carry the raw body: never log or return that data.
    const parserError = error as { type?: string } | null;
    const parserErrors: Record<string, [number, string]> = {
      'entity.parse.failed': [400, 'Corps JSON invalide.'],
      'entity.too.large': [413, 'Corps de requête trop volumineux.'],
      'encoding.unsupported': [415, 'Encodage de requête non pris en charge.'],
      'charset.unsupported': [415, 'Encodage de requête non pris en charge.'],
      'request.aborted': [400, 'Requête interrompue.'],
      'request.size.invalid': [400, 'Taille de requête invalide.'],
    };
    const parserFailure = parserError?.type
      ? parserErrors[parserError.type]
      : undefined;
    if (parserFailure) {
      const [status, message] = parserFailure;
      response.status(status).json({ error: { status, message } });
      return;
    }
    console.error('Une requête a échoué.', { status: 500 });
    response.status(500).json({
      error: { status: 500, message: 'Une erreur interne est survenue.' },
    });
  };
  application.use(errorHandler);

  return application;
}
