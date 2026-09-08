import { Link, useLocation } from 'react-router-dom';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const location = useLocation();
  if (totalPages <= 1) return null;

  function href(targetPage: number) {
    const parameters = new URLSearchParams(location.search);
    parameters.set('page', String(targetPage));
    return `${location.pathname}?${parameters.toString()}`;
  }

  return (
    <nav className="catalog-pagination" aria-label="Pagination des artisans">
      <ul className="pagination mb-0">
        <li className={`page-item${page === 1 ? ' disabled' : ''}`}>
          {page === 1 ? (
            <span className="page-link" aria-disabled="true">
              Précédente
            </span>
          ) : (
            <Link className="page-link" to={href(page - 1)} rel="prev">
              Précédente
            </Link>
          )}
        </li>
        <li className="page-item">
          <span className="page-link" aria-current="page">
            Page {page} sur {totalPages}
          </span>
        </li>
        <li className={`page-item${page === totalPages ? ' disabled' : ''}`}>
          {page === totalPages ? (
            <span className="page-link" aria-disabled="true">
              Suivante
            </span>
          ) : (
            <Link className="page-link" to={href(page + 1)} rel="next">
              Suivante
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
