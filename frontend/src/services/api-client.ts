import type { CategorySummary } from '../types/category';
import type {
  ArtisanDetail,
  ArtisanListResponse,
  ArtisanSummary,
  ContactPayload,
} from '../types/artisan';

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

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status === 429
        ? 'Trop de messages ont été envoyés. Réessayez plus tard.'
        : "Le message n'a pas pu être envoyé.",
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
  searchArtisans(search: string, page: number, signal?: AbortSignal) {
    const query = new URLSearchParams({ search, page: String(page) });
    return get<ArtisanListResponse>(`/artisans?${query.toString()}`, signal);
  },
  getArtisansByCategory(slug: string, page: number, signal?: AbortSignal) {
    const query = new URLSearchParams({ page: String(page) });
    return get<ArtisanListResponse>(
      `/categories/${encodeURIComponent(slug)}/artisans?${query.toString()}`,
      signal,
    );
  },
  async getArtisan(slug: string, signal?: AbortSignal) {
    const response = await get<DataResponse<ArtisanDetail>>(
      `/artisans/${encodeURIComponent(slug)}`,
      signal,
    );
    return response.data;
  },
  sendContact(slug: string, payload: ContactPayload) {
    return post<DataResponse<{ message: string }>>(
      `/artisans/${encodeURIComponent(slug)}/contact`,
      payload,
    );
  },
};
