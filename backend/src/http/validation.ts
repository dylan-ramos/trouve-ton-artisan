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
const singleLine = z
  .string()
  .trim()
  .refine((value) => !/[\r\n]/.test(value));
const contact = z
  .object({
    name: singleLine.min(2).max(100),
    email: singleLine.max(254).pipe(z.email()),
    subject: singleLine.min(3).max(150),
    message: z.string().trim().min(10).max(5000),
    website: z.string().max(200).optional().default(''),
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
export const parseContact = (request: Request) => parse(contact, request.body);
export type ContactInput = z.infer<typeof contact>;
