export interface SpecialtySummary {
  id: number;
  name: string;
  slug: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  specialties: SpecialtySummary[];
}
