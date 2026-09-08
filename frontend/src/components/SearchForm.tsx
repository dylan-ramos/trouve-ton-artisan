import { type SubmitEvent, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchFormProps {
  compact?: boolean;
  onSubmitted?: () => void;
}

export function SearchForm({ compact = false, onSubmitted }: SearchFormProps) {
  const [search, setSearch] = useState('');
  const inputId = useId();
  const navigate = useNavigate();

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    void navigate(`/recherche?search=${encodeURIComponent(query)}`);
    onSubmitted?.();
  }

  return (
    <form
      className={`search-form${compact ? ' search-form--compact' : ''}`}
      role="search"
      onSubmit={submit}
    >
      <label className="visually-hidden" htmlFor={inputId}>
        Rechercher un artisan par nom
      </label>
      <input
        className="form-control"
        id={inputId}
        type="search"
        maxLength={100}
        placeholder="Rechercher un artisan"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <button className="btn btn-primary" type="submit" aria-label="Rechercher">
        <span aria-hidden="true">⌕</span>
        <span className={compact ? 'visually-hidden' : ''}>Rechercher</span>
      </button>
    </form>
  );
}
