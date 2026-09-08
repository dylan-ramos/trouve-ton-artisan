import type { ApplicationModels } from '../../models.js';
import { Op } from 'sequelize';
import { toPublicArtisan } from './artisan.dto.js';

export interface ArtisanSearchInput {
  search?: string | undefined;
  category?: string | undefined;
  page: number;
  limit: number;
}

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

  async search(input: ArtisanSearchInput) {
    const escapedSearch = input.search?.replace(/[\\%_]/g, '\\$&');
    const result = await this.models.Artisan.findAndCountAll({
      ...(escapedSearch
        ? { where: { name: { [Op.like]: `%${escapedSearch}%` } } }
        : {}),
      include: [
        {
          association: 'specialty',
          required: true,
          include: [
            {
              association: 'category',
              required: true,
              ...(input.category ? { where: { slug: input.category } } : {}),
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
      limit: input.limit,
      offset: (input.page - 1) * input.limit,
      distinct: true,
    });

    return {
      data: result.rows.map(toPublicArtisan),
      meta: {
        page: input.page,
        limit: input.limit,
        total: result.count,
        totalPages: Math.ceil(result.count / input.limit),
      },
    };
  }

  private publicSpecialtyAssociation() {
    return {
      association: 'specialty' as const,
      required: true,
      include: [{ association: 'category' as const, required: true }],
    };
  }
}
