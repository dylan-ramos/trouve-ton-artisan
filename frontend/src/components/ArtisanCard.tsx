import { Link } from 'react-router-dom';

import type { ArtisanSummary } from '../types/artisan';
import { Rating } from './Rating';

interface ArtisanCardProps {
  artisan: ArtisanSummary;
  headingLevel?: 2 | 3;
}

export function ArtisanCard({ artisan, headingLevel = 3 }: ArtisanCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="artisan-card">
      <div className="artisan-card__body">
        <Heading className="h4">
          <Link className="artisan-card__link" to={`/artisan/${artisan.slug}`}>
            {artisan.name}
          </Link>
        </Heading>
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
