import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { App } from './App';

const categoriesResponse = {
  data: [{ id: 1, name: 'Bâtiment', slug: 'batiment', specialties: [] }],
};

function mockCategories() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            input.endsWith('/categories')
              ? categoriesResponse
              : input.endsWith('/artisans/featured')
                ? { data: [] }
                : {
                    data: [],
                    meta: {
                      page: 1,
                      limit: 12,
                      total: 0,
                      totalPages: 0,
                    },
                  },
          ),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    ),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  test('affiche les repères et la navigation alimentée par l’API', async () => {
    mockCategories();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Trouvez l’artisan adapté à votre besoin',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /contenu principal/i }),
    ).toHaveAttribute('href', '#main-content');
    expect(
      await screen.findByRole('link', { name: 'Bâtiment' }),
    ).toHaveAttribute('href', '/artisans/batiment');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('annonce et ouvre le menu mobile', () => {
    mockCategories();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /menu/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveTextContent('Fermer');
  });

  test('encode la recherche dans la navigation', async () => {
    mockCategories();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    const search = screen.getAllByRole('searchbox')[0];
    if (!search) throw new Error('Champ de recherche introuvable.');
    fireEvent.change(search, { target: { value: '  Labbé & fils  ' } });
    fireEvent.submit(search.closest('form') as HTMLFormElement);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: 'Résultats pour « Labbé & fils »',
        }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('main')).toHaveFocus();
  });

  test.each([
    ['/mentions-legales', 'Mentions légales'],
    ['/donnees-personnelles', 'Données personnelles'],
    ['/accessibilite', 'Accessibilité'],
    ['/cookies', 'Gestion des cookies'],
  ])('rend directement la page %s', async (path, heading) => {
    mockCategories();
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe(`${heading} | Trouve ton artisan`),
    );
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    );
  });

  test('rend une vraie page 404 et interdit son indexation', async () => {
    mockCategories();
    render(
      <MemoryRouter initialEntries={['/adresse-inconnue']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Cette page est introuvable',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Retour à l’accueil' }),
    ).toHaveAttribute('href', '/');
    await waitFor(() =>
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      ),
    );
  });

  test('actualise les métadonnées de navigation et les données structurées', async () => {
    mockCategories();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'http://localhost:5173/',
      ),
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Trouve ton artisan en Auvergne-Rhône-Alpes',
    );
    expect(
      document.querySelector('script[type="application/ld+json"]'),
    ).toHaveTextContent('WebSite');
  });
});
