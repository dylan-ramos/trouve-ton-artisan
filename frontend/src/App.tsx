import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

function FoundationPage() {
  return (
    <div className="container page-section">
      <h1>Trouve ton artisan</h1>
      <p>
        Le service régional qui vous aide à trouver le professionnel adapté à
        votre besoin.
      </p>
    </div>
  );
}

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
        <Route index element={<FoundationPage />} />
        <Route path="artisans/:category" element={<PlaceholderPage />} />
        <Route path="recherche" element={<PlaceholderPage />} />
        <Route path="*" element={<FoundationPage />} />
      </Route>
    </Routes>
  );
}
