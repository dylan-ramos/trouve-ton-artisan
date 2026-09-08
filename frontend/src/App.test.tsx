import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    expect(
      await screen.findByRole('heading', {
        name: 'Résultats pour « Labbé & fils »',
      }),
    ).toBeInTheDocument();
  });
});
