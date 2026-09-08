import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ArtisanPage } from './pages/ArtisanPage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="artisans/:category" element={<CatalogPage />} />
        <Route path="artisan/:slug" element={<ArtisanPage />} />
        <Route path="recherche" element={<CatalogPage />} />
        <Route
          path="mentions-legales"
          element={<LegalPage page="mentions-legales" />}
        />
        <Route
          path="donnees-personnelles"
          element={<LegalPage page="donnees-personnelles" />}
        />
        <Route
          path="accessibilite"
          element={<LegalPage page="accessibilite" />}
        />
        <Route path="cookies" element={<LegalPage page="cookies" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
