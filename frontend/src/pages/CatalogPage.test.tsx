import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { CatalogPage } from './CatalogPage';

const categories = [
  ['batiment', 'Bâtiment'],
  ['services', 'Services'],
  ['fabrication', 'Fabrication'],
  ['alimentation', 'Alimentation'],
] as const;
const artisan = (name: string) => ({
  id: name.length,
  name,
  slug: name.toLocaleLowerCase('fr-FR').replaceAll(' ', '-'),
  rating: 4.7,
  city: 'Lyon',
  imageUrl: null,
  isFeatured: false,
  specialty: {
    name: 'Artisan',
    slug: 'artisan',
    category: { name: 'Services', slug: 'services' },
  },
});
const list = (data: ReturnType<typeof artisan>[]) => ({
  data,
  meta: {
    page: 1,
    limit: 12,
    total: data.length,
    totalPages: data.length ? 1 : 0,
  },
});
const response = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

function renderRoute(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/artisans/:category" element={<CatalogPage />} />
        <Route path="/recherche" element={<CatalogPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CatalogPage', () => {
  test.each(categories)(
    'affiche la catégorie %s avec son nom issu de l’API',
    async (slug, name) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((input: string) =>
          Promise.resolve(
            response(
              input.endsWith('/categories')
                ? {
                    data: categories.map(
                      ([categorySlug, categoryName], id) => ({
                        id,
                        slug: categorySlug,
                        name: categoryName,
                        specialties: [],
                      }),
                    ),
                  }
                : list([artisan(`${name} Pro`)]),
            ),
          ),
        ),
      );
      renderRoute(`/artisans/${slug}`);
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: `Artisans — ${name}`,
        }),
      ).toBeInTheDocument();
    },
  );

  test('recherche un nom accentué et encode les caractères spéciaux', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(list([artisan('Chocolaterie Labbé')])));
    vi.stubGlobal('fetch', fetchMock);
    renderRoute('/recherche?search=Labb%C3%A9%20%26%20fils');

    expect(await screen.findByText('Chocolaterie Labbé')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/artisans?search=Labb%C3%A9+%26+fils&page=1',
      expect.any(Object),
    );
  });

  test('présente un état vide quand aucun nom ne correspond', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(list([]))));
    renderRoute('/recherche?search=introuvable');
    expect(await screen.findByText('Aucun artisan trouvé')).toBeInTheDocument();
  });

  test('refuse une recherche trop longue sans appeler l’API', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderRoute(`/recherche?search=${'a'.repeat(101)}`);
    expect(
      screen.getByRole('heading', { name: 'Recherche invalide' }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('conserve la recherche dans la pagination et charge la deuxième page', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string) => {
      const page = Number(
        new URL(input, 'http://localhost').searchParams.get('page'),
      );
      return Promise.resolve(
        response({
          data: [artisan(page === 1 ? 'Premier artisan' : 'Dernier artisan')],
          meta: { page, limit: 12, total: 13, totalPages: 2 },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    renderRoute('/recherche?search=Labb%C3%A9');
    const next = await screen.findByRole('link', { name: 'Suivante' });
    expect(next).toHaveAttribute('href', '/recherche?search=Labb%C3%A9&page=2');
    expect(
      screen.queryByRole('link', { name: 'Précédente' }),
    ).not.toBeInTheDocument();
    fireEvent.click(next);
    expect(await screen.findByText('Dernier artisan')).toBeInTheDocument();
    expect(screen.queryByText('Premier artisan')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Suivante' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Précédente' })).toHaveAttribute(
      'href',
      '/recherche?search=Labb%C3%A9&page=1',
    );
  });

  test('récupère après une panne de recherche sans perdre les paramètres', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce(response(list([artisan('Artisan retrouvé')])));
    vi.stubGlobal('fetch', fetchMock);
    renderRoute('/recherche?search=artisan');
    fireEvent.click(await screen.findByRole('button', { name: /réessayer/i }));
    expect(await screen.findByText('Artisan retrouvé')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/artisans?search=artisan&page=1',
      expect.any(Object),
    );
  });

  test('ignore une réponse devenue obsolète', async () => {
    let resolveOld: ((value: Response) => void) | undefined;
    const oldResponse = new Promise<Response>((resolve) => {
      resolveOld = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation((input: string) =>
          input.includes('search=ancienne')
            ? oldResponse
            : Promise.resolve(response(list([artisan('Résultat récent')]))),
        ),
    );
    function NavigationFixture() {
      const navigate = useNavigate();
      return (
        <>
          <button
            type="button"
            onClick={() => void navigate('/recherche?search=nouvelle')}
          >
            Nouvelle recherche
          </button>
          <Routes>
            <Route path="/recherche" element={<CatalogPage />} />
          </Routes>
        </>
      );
    }
    render(
      <MemoryRouter initialEntries={['/recherche?search=ancienne']}>
        <NavigationFixture />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle recherche' }));
    expect(await screen.findByText('Résultat récent')).toBeInTheDocument();
    resolveOld?.(response(list([artisan('Ancien résultat')])));
    await waitFor(() =>
      expect(screen.queryByText('Ancien résultat')).not.toBeInTheDocument(),
    );
  });
});
