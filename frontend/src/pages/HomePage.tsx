import { useEffect, useState } from 'react';

import { ArtisanCard } from '../components/ArtisanCard';
import { SearchForm } from '../components/SearchForm';
import { Seo } from '../components/Seo';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { apiClient } from '../services/api-client';
import { getPublicUrl } from '../services/site-url';
import type { ArtisanSummary } from '../types/artisan';

const steps = [
  'Choisir la catégorie d’artisanat dans le menu.',
  'Choisir un artisan.',
  'Le contacter via le formulaire de contact.',
  'Une réponse sera apportée sous 48h.',
];

export function HomePage() {
  const [artisans, setArtisans] = useState<ArtisanSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void apiClient
      .getFeaturedArtisans(controller.signal)
      .then((data) => {
        setArtisans(data);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, [requestKey]);

  function retry() {
    setStatus('loading');
    setRequestKey((value) => value + 1);
  }

  return (
    <>
      <Seo
        title="Trouve ton artisan en Auvergne-Rhône-Alpes"
        description="Trouvez et contactez un artisan qualifié en Auvergne-Rhône-Alpes."
        canonicalPath="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Trouve ton artisan',
          url: getPublicUrl('/'),
          inLanguage: 'fr-FR',
        }}
      />
      <section className="home-hero">
        <div className="container home-hero__content">
          <p className="home-hero__eyebrow">Auvergne-Rhône-Alpes</p>
          <h1>Trouvez l’artisan adapté à votre besoin</h1>
          <p className="home-hero__lead">
            Recherchez facilement un professionnel près de chez vous et
            contactez-le directement.
          </p>
          <SearchForm />
        </div>
      </section>

      <section className="page-section" aria-labelledby="steps-title">
        <div className="container">
          <h2 id="steps-title">Comment trouver mon artisan ?</h2>
          <ol className="discovery-steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="page-section featured-section"
        aria-labelledby="featured-title"
      >
        <div className="container">
          <h2 id="featured-title">Les artisans du mois</h2>
          {status === 'loading' && (
            <LoadingState label="Chargement des artisans du mois…" />
          )}
          {status === 'error' && (
            <ErrorState
              message="Les artisans du mois ne peuvent pas être chargés."
              onRetry={retry}
            />
          )}
          {status === 'success' && artisans.length === 0 && (
            <EmptyState title="Aucun artisan à présenter">
              Revenez prochainement pour découvrir les artisans du mois.
            </EmptyState>
          )}
          {status === 'success' && artisans.length > 0 && (
            <div className="artisan-grid">
              {artisans.map((artisan) => (
                <ArtisanCard artisan={artisan} key={artisan.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
