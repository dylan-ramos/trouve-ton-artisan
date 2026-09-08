import type { ApplicationModels } from '../../models.js';

export class ArtisanService {
  constructor(private readonly models: ApplicationModels) {}

  listAll() {
    return this.models.Artisan.findAll({
      include: [this.publicSpecialtyAssociation()],
      order: [['name', 'ASC']],
    });
  }

  listFeatured() {
    return this.models.Artisan.findAll({
      where: { isFeatured: true },
      include: [this.publicSpecialtyAssociation()],
      order: [
        ['rating', 'DESC'],
        ['name', 'ASC'],
      ],
    });
  }

  findBySlug(slug: string) {
    return this.models.Artisan.findOne({
      where: { slug },
      include: [this.publicSpecialtyAssociation()],
    });
  }

  private publicSpecialtyAssociation() {
    return {
      association: 'specialty' as const,
      required: true,
      include: [{ association: 'category' as const, required: true }],
    };
  }
}
