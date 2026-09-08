import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../http/api-error.js';
import {
  parseArtisanQuery,
  parseContact,
  parseSlug,
} from '../http/validation.js';
import { toPublicArtisan } from './artisans/artisan.dto.js';
import type { ArtisanService } from './artisans/artisan.service.js';
import type { CategoryService } from './categories/category.service.js';
import type { ContactService } from './contact/contact.service.js';

export function createApiRouter(
  categoryService: CategoryService,
  artisanService: ArtisanService,
  contactService?: ContactService,
) {
  const router = Router();
  router.get('/categories', async (_request, response) => {
    const categories = await categoryService.listWithSpecialties();
    response.json({
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        specialties:
          category.specialties?.map(({ id, name, slug }) => ({
            id,
            name,
            slug,
          })) ?? [],
      })),
    });
  });
  router.get('/categories/:slug/artisans', async (request, response) => {
    const slug = parseSlug(request.params.slug);
    if (!(await categoryService.findBySlug(slug)))
      throw new ApiError(404, 'Catégorie introuvable.');
    response.json(
      await artisanService.search({
        ...parseArtisanQuery(request),
        category: slug,
      }),
    );
  });
  router.get('/artisans/featured', async (_request, response) => {
    response.json({
      data: (await artisanService.listFeatured()).map(toPublicArtisan),
    });
  });
  router.get('/artisans/:slug', async (request, response) => {
    const artisan = await artisanService.findBySlug(
      parseSlug(request.params.slug),
    );
    if (!artisan) throw new ApiError(404, 'Artisan introuvable.');
    response.json({ data: toPublicArtisan(artisan) });
  });
  if (contactService) {
    router.post(
      '/artisans/:slug/contact',
      rateLimit({
        windowMs: 15 * 60_000,
        limit: 5,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
          error: {
            status: 429,
            message: 'Trop de messages envoyés. Veuillez réessayer plus tard.',
          },
        },
      }),
      async (request, response) => {
        await contactService.send(
          parseSlug(request.params.slug),
          parseContact(request),
        );
        response.status(202).json({ data: { message: 'Message envoyé.' } });
      },
    );
  }
  router.get('/artisans', async (request, response) => {
    response.json(await artisanService.search(parseArtisanQuery(request)));
  });
  return router;
}
