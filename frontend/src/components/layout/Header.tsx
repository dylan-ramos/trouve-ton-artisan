import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { apiClient } from '../../services/api-client';
import type { CategorySummary } from '../../types/category';
import { SearchForm } from '../SearchForm';
import { ErrorState } from '../ui/ErrorState';
import { LoadingState } from '../ui/LoadingState';

export function Header() {
  const menuRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    void apiClient
      .getCategories(controller.signal)
      .then((data) => {
        if (isCurrent) setCategories(data);
      })
      .catch((error: unknown) => {
        if (
          isCurrent &&
          !(error instanceof Error && error.name === 'AbortError')
        ) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [requestKey]);

  function retryCategories() {
    setIsLoading(true);
    setHasError(false);
    setRequestKey((value) => value + 1);
  }

  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          closeMenu();
          menuRef.current?.focus();
        }
      }}
    >
      <div className="container site-header__top">
        <Link
          className="site-logo"
          to="/"
          aria-label="Trouve ton artisan — accueil"
        >
          <img
            src="/assets/logo.png"
            width="1735"
            height="979"
            alt="Trouve ton artisan"
          />
        </Link>
        <div className="site-header__desktop-search">
          <SearchForm compact label="Recherche dans le menu" />
        </div>
        <button
          ref={menuRef}
          className="menu-toggle"
          type="button"
          aria-controls="main-navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="menu-toggle__icon" aria-hidden="true" />
          <span>{isOpen ? 'Fermer' : 'Menu'}</span>
        </button>
      </div>
      <div className={`site-header__panel${isOpen ? ' is-open' : ''}`}>
        <div className="container">
          <div className="site-header__mobile-search">
            <SearchForm
              label="Recherche dans le menu"
              onSubmitted={closeMenu}
            />
          </div>
          <nav id="main-navigation" aria-label="Navigation principale">
            <ul className="main-navigation">
              <li>
                <NavLink to="/" end onClick={closeMenu}>
                  Accueil
                </NavLink>
              </li>
              {isLoading && (
                <li>
                  <LoadingState label="Chargement des catégories…" compact />
                </li>
              )}
              {hasError && (
                <li>
                  <ErrorState
                    message="Catégories indisponibles."
                    compact
                    onRetry={retryCategories}
                  />
                </li>
              )}
              {!isLoading &&
                !hasError &&
                categories.map((category) => (
                  <li key={category.id}>
                    <NavLink
                      to={`/artisans/${category.slug}`}
                      onClick={closeMenu}
                    >
                      {category.name}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
