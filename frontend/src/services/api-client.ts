import type { CategorySummary } from '../types/category';
import type { ArtisanSummary } from '../types/artisan';

interface DataResponse<T> {
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new ApiError(
      'Le service est momentanément indisponible.',
      response.status,
    );
  }
  return (await response.json()) as T;
}

export const apiClient = {
  async getCategories(signal?: AbortSignal) {
    const response = await get<DataResponse<CategorySummary[]>>(
      '/categories',
      signal,
    );
    return response.data;
  },
  async getFeaturedArtisans(signal?: AbortSignal) {
    const response = await get<DataResponse<ArtisanSummary[]>>(
      '/artisans/featured',
      signal,
    );
    return response.data;
  },
};
