import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ArtisanPage } from './ArtisanPage';

const artisan = {
  id: 3,
  name: 'Chocolaterie Labbé',
  slug: 'chocolaterie-labbe',
  rating: 4.9,
  city: 'Lyon',
  about: 'Une chocolaterie régionale.',
  websiteUrl: 'https://chocolaterie-labbe.fr',
  imageUrl: null,
  isFeatured: true,
  specialty: {
    name: 'Chocolatier',
    slug: 'chocolatier',
    category: { name: 'Alimentation', slug: 'alimentation' },
  },
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/artisan/chocolaterie-labbe']}>
      <Routes>
        <Route path="/artisan/:slug" element={<ArtisanPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ArtisanPage', () => {
  test('affiche la fiche complète et un lien externe sûr', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(artisan)));
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: artisan.name }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Note : 4,9 sur 5')).toBeInTheDocument();
    expect(screen.getByText(artisan.about)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Visiter le site internet/ }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByText(/gmail\.com/)).not.toBeInTheDocument();
  });

  test('annonce les erreurs de chaque champ', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(artisan)));
    renderPage();
    await screen.findByRole('heading', { level: 1, name: artisan.name });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le message' }));
    expect(screen.getByLabelText('Nom')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('E-mail')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Objet')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Message')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('envoie une seule fois et annonce le succès', async () => {
    let resolveSend: ((response: Response) => void) | undefined;
    const sendResponse = new Promise<Response>((resolve) => {
      resolveSend = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(artisan))
      .mockReturnValueOnce(sendResponse);
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await screen.findByRole('heading', { level: 1, name: artisan.name });
    fireEvent.change(screen.getByLabelText('Nom'), {
      target: { value: 'Dylan Martin' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'dylan@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Objet'), {
      target: { value: 'Demande de tarif' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Bonjour, pouvez-vous me répondre ?' },
    });
    const button = screen.getByRole('button', { name: 'Envoyer le message' });
    fireEvent.click(button);
    expect(
      screen.getByRole('button', { name: 'Envoi en cours…' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Envoi en cours…' }));
    resolveSend?.(json({ message: 'Message envoyé.' }, 202));
    expect(
      await screen.findByText('Votre message a bien été envoyé.'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
