import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ArtisanPage } from './pages/ArtisanPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="artisans/:category" element={<CatalogPage />} />
        <Route path="artisan/:slug" element={<ArtisanPage />} />
        <Route path="recherche" element={<CatalogPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
