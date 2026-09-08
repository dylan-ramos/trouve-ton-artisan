import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { App } from './App';

describe('App', () => {
  test('affiche le socle de l’application', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Trouve ton artisan' }),
    ).toBeInTheDocument();
  });
});
