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

export interface ArtisanDetail extends ArtisanSummary {
  about: string;
  websiteUrl: string | null;
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

export interface ArtisanListResponse {
  data: ArtisanSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
