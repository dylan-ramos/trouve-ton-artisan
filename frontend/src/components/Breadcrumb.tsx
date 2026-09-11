import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  current: string;
}

export function Breadcrumb({ current }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d’Ariane">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/">Accueil</Link>
        </li>
        <li className="breadcrumb-item active" aria-current="page">
          {current}
        </li>
      </ol>
    </nav>
  );
}
