import type { ApplicationModels } from '../../models.js';

export class CategoryService {
  constructor(private readonly models: ApplicationModels) {}

  listWithSpecialties() {
    return this.models.Category.findAll({
      include: [{ association: 'specialties', required: false }],
      order: [
        ['displayOrder', 'ASC'],
        [{ model: this.models.Specialty, as: 'specialties' }, 'name', 'ASC'],
      ],
    });
  }

  findBySlug(slug: string) {
    return this.models.Category.findOne({
      where: { slug },
      include: [{ association: 'specialties', required: false }],
    });
  }
}
