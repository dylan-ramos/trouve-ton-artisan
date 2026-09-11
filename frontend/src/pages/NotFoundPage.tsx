import { Link } from 'react-router-dom';

import { Seo } from '../components/Seo';

export function NotFoundPage() {
  return (
    <div className="container page-section not-found-page">
      <Seo
        title="Page introuvable | Trouve ton artisan"
        description="La page demandée est introuvable."
        canonicalPath="/404"
        noIndex
      />
      <svg
        className="not-found-page__illustration"
        viewBox="0 0 320 180"
        role="img"
        aria-labelledby="not-found-illustration-title"
      >
        <title id="not-found-illustration-title">
          Une boîte à outils ouverte
        </title>
        <path d="M65 75h190v75H65z" />
        <path d="M50 65h220v28H50zM125 65V47h70v18" />
        <path d="m105 35 30 30M215 35l-30 30" />
      </svg>
      <p className="not-found-page__code" aria-hidden="true">
        404
      </p>
      <h1>Cette page est introuvable</h1>
      <p>
        L’adresse est peut-être incorrecte ou la page n’est plus disponible.
      </p>
      <Link className="btn btn-primary" to="/">
        Retour à l’accueil
      </Link>
    </div>
  );
}
