import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Breadcrumb } from '../components/Breadcrumb';
import { ContactForm } from '../components/ContactForm';
import { Rating } from '../components/Rating';
import { Seo } from '../components/Seo';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { apiClient } from '../services/api-client';
import { getPublicUrl } from '../services/site-url';
import type { ArtisanDetail } from '../types/artisan';

function safeWebsite(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function ArtisanContent({ artisan }: { artisan: ArtisanDetail }) {
  const website = safeWebsite(artisan.websiteUrl);
  return (
    <>
      <Seo
        title={`${artisan.name} | Trouve ton artisan`}
        description={`${artisan.name}, ${artisan.specialty.name} à ${artisan.city}. Contactez cet artisan en Auvergne-Rhône-Alpes.`}
        canonicalPath={`/artisan/${artisan.slug}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: artisan.name,
          description: artisan.about,
          url: getPublicUrl(`/artisan/${artisan.slug}`),
          areaServed: artisan.city,
          ...(website ? { sameAs: website } : {}),
        }}
      />
      <Breadcrumb current={artisan.name} />
      <article className="artisan-profile">
        <div className="artisan-profile__visual">
          {artisan.imageUrl ? (
            <img
              src={artisan.imageUrl}
              alt={`Présentation de ${artisan.name}`}
            />
          ) : (
            <div className="artisan-profile__fallback" aria-hidden="true">
              {artisan.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="artisan-profile__summary">
          <p className="artisan-profile__specialty">{artisan.specialty.name}</p>
          <h1>{artisan.name}</h1>
          <Rating value={artisan.rating} />
          <p className="artisan-profile__city">{artisan.city}</p>
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer">
              Visiter le site internet{' '}
              <span className="visually-hidden">
                de {artisan.name} — nouvelle fenêtre
              </span>
            </a>
          )}
        </div>
        <section
          className="artisan-profile__about"
          aria-labelledby="about-title"
        >
          <h2 id="about-title">À propos</h2>
          <p>{artisan.about}</p>
        </section>
        <section
          className="artisan-profile__contact"
          aria-labelledby="contact-title"
        >
          <h2 id="contact-title">Contacter cet artisan</h2>
          <p>
            Décrivez votre besoin. Une réponse vous sera apportée sous 48
            heures.
          </p>
          <ContactForm artisanSlug={artisan.slug} />
        </section>
      </article>
    </>
  );
}

export function ArtisanPage() {
  const { slug = '' } = useParams();
  return <ArtisanRequest key={slug} slug={slug} />;
}

function ArtisanRequest({ slug }: { slug: string }) {
  const [artisan, setArtisan] = useState<ArtisanDetail>();
  const [hasError, setHasError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    void apiClient
      .getArtisan(slug, controller.signal)
      .then((data) => {
        if (isCurrent) setArtisan(data);
      })
      .catch((error: unknown) => {
        if (
          isCurrent &&
          !(error instanceof Error && error.name === 'AbortError')
        )
          setHasError(true);
      });
    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [requestKey, slug]);

  function retry() {
    setHasError(false);
    setRequestKey((value) => value + 1);
  }

  return (
    <div className="container page-section">
      {hasError ? (
        <>
          <Seo
            title="Fiche artisan indisponible | Trouve ton artisan"
            description="Cette fiche artisan est momentanément indisponible."
            canonicalPath={`/artisan/${slug}`}
            noIndex
          />
          <h1>Fiche artisan indisponible</h1>
          <ErrorState
            message="Cette fiche artisan ne peut pas être chargée."
            onRetry={retry}
          />
        </>
      ) : artisan ? (
        <ArtisanContent artisan={artisan} />
      ) : (
        <>
          <Seo
            title="Fiche artisan | Trouve ton artisan"
            description="Consultez la fiche de cet artisan en Auvergne-Rhône-Alpes."
            canonicalPath={`/artisan/${slug}`}
            noIndex
          />
          <h1>Fiche artisan</h1>
          <LoadingState label="Chargement de la fiche artisan…" />
        </>
      )}
    </div>
  );
}
