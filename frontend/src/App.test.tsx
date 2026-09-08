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
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(categoriesResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
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
      screen.getByRole('heading', { level: 1, name: 'Trouve ton artisan' }),
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

  test('encode la recherche dans la navigation', () => {
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
      screen.getByRole('heading', { name: 'Nos artisans' }),
    ).toBeInTheDocument();
  });
});
