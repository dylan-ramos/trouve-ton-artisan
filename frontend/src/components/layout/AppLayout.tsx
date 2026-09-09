import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Footer } from './Footer';
import { Header } from './Header';

export function AppLayout() {
  const { pathname, search } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousRoute = useRef(pathname + search);

  useEffect(() => {
    const route = pathname + search;
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <Header />
      <main ref={mainRef} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
