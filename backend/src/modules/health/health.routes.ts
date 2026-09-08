import { Router } from 'express';

export type DatabaseHealthCheck = () => Promise<void>;

export function createHealthRouter(checkDatabase: DatabaseHealthCheck): Router {
  const router = Router();

  router.get('/', async (_request, response) => {
    try {
      await checkDatabase();
      response.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      response
        .status(503)
        .json({ status: 'unavailable', database: 'disconnected' });
    }
  });

  return router;
}
