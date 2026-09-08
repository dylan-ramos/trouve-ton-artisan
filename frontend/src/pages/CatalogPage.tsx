import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { ArtisanCard } from '../components/ArtisanCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { Pagination } from '../components/Pagination';
import { Seo } from '../components/Seo';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { apiClient } from '../services/api-client';
import type { ArtisanListResponse } from '../types/artisan';

type CatalogRequest =
  | { mode: 'category'; value: string; page: number }
  | { mode: 'search'; value: string; page: number };

interface CatalogResultsProps {
  request: CatalogRequest;
  onRetry: () => void;
}

function CatalogResults({ request, onRetry }: CatalogResultsProps) {
  const [result, setResult] = useState<ArtisanListResponse>();
  const [categoryName, setCategoryName] = useState('Artisans');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    const promise =
      request.mode === 'search'
        ? apiClient.searchArtisans(
            request.value,
            request.page,
            controller.signal,
          )
        : Promise.all([
            apiClient.getArtisansByCategory(
              request.value,
              request.page,
              controller.signal,
            ),
            apiClient.getCategories(controller.signal),
          ]).then(([response, categories]) => {
            const category = categories.find(
              ({ slug }) => slug === request.value,
            );
            if (isCurrent && category) setCategoryName(category.name);
            return response;
          });

    void promise
      .then((response) => {
        if (isCurrent) setResult(response);
      })
      .catch((error: unknown) => {
        if (
          isCurrent &&
          !(error instanceof Error && error.name === 'AbortError')
        ) {
          setHasError(true);
        }
      });
    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [request]);

  const title =
    request.mode === 'search'
      ? `Résultats pour « ${request.value} »`
      : `Artisans — ${categoryName}`;

  if (hasError)
    return (
      <ErrorState
        message="Les artisans ne peuvent pas être chargés."
        onRetry={onRetry}
      />
    );
  if (!result) return <LoadingState label="Chargement des artisans…" />;

  return (
    <>
      <Seo
        title={`${title} | Trouve ton artisan`}
        description={`Consultez ${title.toLocaleLowerCase('fr-FR')} en Auvergne-Rhône-Alpes.`}
      />
      <Breadcrumb current={title} />
      <h1>{title}</h1>
      <p className="catalog-count" aria-live="polite">
        {result.meta.total}{' '}
        {result.meta.total > 1 ? 'artisans trouvés' : 'artisan trouvé'}
      </p>
      {result.data.length === 0 ? (
        <EmptyState title="Aucun artisan trouvé">
          Modifiez votre recherche ou choisissez une autre catégorie.
        </EmptyState>
      ) : (
        <div className="artisan-grid">
          {result.data.map((artisan) => (
            <ArtisanCard artisan={artisan} key={artisan.id} />
          ))}
        </div>
      )}
      <Pagination page={result.meta.page} totalPages={result.meta.totalPages} />
    </>
  );
}

export function CatalogPage() {
  const { category } = useParams();
  const [searchParameters] = useSearchParams();
  const [requestKey, setRequestKey] = useState(0);
  const search = searchParameters.get('search')?.trim() ?? '';
  const rawPage = Number(searchParameters.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  if (!category && !search) {
    return (
      <div className="container page-section">
        <Seo
          title="Recherche | Trouve ton artisan"
          description="Recherchez un artisan par nom."
        />
        <Breadcrumb current="Recherche" />
        <h1>Rechercher un artisan</h1>
        <EmptyState title="Saisissez un nom">
          Utilisez le champ de recherche pour trouver un artisan.
        </EmptyState>
      </div>
    );
  }
  if (!category && search.length > 100) {
    return (
      <div className="container page-section">
        <Breadcrumb current="Recherche" />
        <h1>Recherche invalide</h1>
        <ErrorState message="La recherche ne doit pas dépasser 100 caractères." />
      </div>
    );
  }

  const request: CatalogRequest = category
    ? { mode: 'category', value: category, page }
    : { mode: 'search', value: search, page };
  return (
    <div className="container page-section">
      <CatalogResults
        key={`${request.mode}-${request.value}-${request.page}-${requestKey}`}
        request={request}
        onRetry={() => setRequestKey((value) => value + 1)}
      />
    </div>
  );
}
