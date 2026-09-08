import { Outlet } from 'react-router-dom';

import { Footer } from './Footer';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
