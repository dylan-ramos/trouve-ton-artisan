import { Route, Routes } from 'react-router-dom';

function FoundationPage() {
  return (
    <main className="container py-5">
      <h1>Trouve ton artisan</h1>
      <p>Le socle de l’application est opérationnel.</p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="*" element={<FoundationPage />} />
    </Routes>
  );
}
