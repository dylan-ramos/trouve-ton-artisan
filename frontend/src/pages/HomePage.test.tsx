import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { HomePage } from './HomePage';

const artisan = (id: number) => ({
  id,
  name: `Artisan ${id}`,
  slug: `artisan-${id}`,
  rating: 4.8,
  city: 'Lyon',
  imageUrl: null,
  isFeatured: true,
  specialty: {
    name: 'Menuisier',
    slug: 'menuisier',
    category: { name: 'Bâtiment', slug: 'batiment' },
  },
});

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderPage() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  test('affiche les quatre étapes exactes et trois artisans accessibles', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse([artisan(1), artisan(2), artisan(3)])),
    );
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Comment trouver mon artisan ?' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(
      screen.getByText('Choisir la catégorie d’artisanat dans le menu.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Choisir un artisan.')).toBeInTheDocument();
    expect(
      screen.getByText('Le contacter via le formulaire de contact.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Une réponse sera apportée sous 48h.'),
    ).toBeInTheDocument();
    expect(await screen.findAllByRole('article')).toHaveLength(3);
    expect(screen.getAllByLabelText('Note : 4,8 sur 5')).toHaveLength(3);
  });

  test('annonce le chargement', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => undefined)),
    );
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Chargement des artisans du mois…',
    );
  });

  test('affiche une erreur et permet une nouvelle tentative', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Réessayer' }));
    expect(
      await screen.findByText('Aucun artisan à présenter'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('gère une liste vide inattendue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    renderPage();
    expect(
      await screen.findByText('Aucun artisan à présenter'),
    ).toBeInTheDocument();
  });
});
