export interface ArtisanSummary {
  id: number;
  name: string;
  slug: string;
  rating: number;
  city: string;
  imageUrl: string | null;
  isFeatured: boolean;
  specialty: {
    name: string;
    slug: string;
    category: {
      name: string;
      slug: string;
    };
  };
}
