import { Link } from 'react-router-dom';

import { Breadcrumb } from '../components/Breadcrumb';
import { Seo } from '../components/Seo';

export type LegalPageKey =
  'mentions-legales' | 'donnees-personnelles' | 'accessibilite' | 'cookies';

const pages: Record<
  LegalPageKey,
  { title: string; description: string; introduction: string }
> = {
  'mentions-legales': {
    title: 'Mentions légales',
    description: 'Consultez les mentions légales de Trouve ton artisan.',
    introduction:
      'Les informations légales complètes seront publiées avant la mise en service du site.',
  },
  'donnees-personnelles': {
    title: 'Données personnelles',
    description:
      'Informations relatives à la protection des données personnelles.',
    introduction:
      'La politique détaillant les traitements de données personnelles et vos droits sera publiée avant la mise en service du site.',
  },
  accessibilite: {
    title: 'Accessibilité',
    description: 'Informations sur l’accessibilité de Trouve ton artisan.',
    introduction:
      'La déclaration d’accessibilité et les résultats de l’audit seront publiés avant la mise en service du site.',
  },
  cookies: {
    title: 'Gestion des cookies',
    description: 'Informations sur la gestion des cookies du site.',
    introduction:
      'La politique relative aux cookies sera complétée avant la mise en service du site. Aucun cookie publicitaire ou de mesure d’audience n’est actuellement déposé.',
  },
};

export function LegalPage({ page }: { page: LegalPageKey }) {
  const content = pages[page];
  return (
    <div className="container page-section legal-page">
      <Seo
        title={`${content.title} | Trouve ton artisan`}
        description={content.description}
        canonicalPath={`/${page}`}
      />
      <Breadcrumb current={content.title} />
      <h1>{content.title}</h1>
      <div className="legal-page__notice" role="status">
        <p>{content.introduction}</p>
      </div>
      <p>
        Pour toute question, utilisez le formulaire de la fiche de l’artisan
        concerné ou consultez les coordonnées de la Région dans le pied de page.
      </p>
      <Link to="/">Retour à l’accueil</Link>
    </div>
  );
}
