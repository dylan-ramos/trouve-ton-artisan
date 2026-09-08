import { Link } from 'react-router-dom';

import type { ArtisanSummary } from '../types/artisan';
import { Rating } from './Rating';

interface ArtisanCardProps {
  artisan: ArtisanSummary;
}

export function ArtisanCard({ artisan }: ArtisanCardProps) {
  return (
    <article className="artisan-card">
      <div className="artisan-card__body">
        <h3 className="h4">
          <Link className="artisan-card__link" to={`/artisan/${artisan.slug}`}>
            {artisan.name}
          </Link>
        </h3>
        <Rating value={artisan.rating} />
        <dl className="artisan-card__details">
          <div>
            <dt>Spécialité</dt>
            <dd>{artisan.specialty.name}</dd>
          </div>
          <div>
            <dt>Localisation</dt>
            <dd>{artisan.city}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
