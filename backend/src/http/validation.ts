import type { Request } from 'express';
import { z } from 'zod';
import { ApiError } from './api-error.js';

const slug = z
  .string()
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const query = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    category: slug.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ApiError(422, 'Paramètres de requête invalides.');
  return result.data;
}
export const parseSlug = (value: unknown) => parse(slug, value);
export const parseArtisanQuery = (request: Request) =>
  parse(query, request.query);
