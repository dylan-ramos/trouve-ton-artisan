import type { Artisan } from './artisan.model.js';
export function toPublicArtisan(artisan: Artisan) {
  const specialty = artisan.specialty;
  if (!specialty?.category) throw new Error('Association artisan incomplète.');
  return {
    id: artisan.id,
    name: artisan.name,
    slug: artisan.slug,
    rating: Number(artisan.rating),
    city: artisan.city,
    about: artisan.about,
    websiteUrl: artisan.websiteUrl,
    imageUrl: artisan.imageUrl,
    isFeatured: artisan.isFeatured,
    specialty: {
      name: specialty.name,
      slug: specialty.slug,
      category: {
        name: specialty.category.name,
        slug: specialty.category.slug,
      },
    },
  };
}
