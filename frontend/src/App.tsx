import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';

function PlaceholderPage() {
  return (
    <div className="container page-section">
      <h1>Nos artisans</h1>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="artisans/:category" element={<CatalogPage />} />
        <Route path="artisan/:slug" element={<PlaceholderPage />} />
        <Route path="recherche" element={<CatalogPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
