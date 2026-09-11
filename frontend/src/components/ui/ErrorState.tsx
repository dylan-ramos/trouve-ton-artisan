interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  message = 'Une erreur est survenue.',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      className={`alert alert-danger${compact ? ' py-2 mb-0' : ''}`}
      role="alert"
    >
      <span>{message}</span>{' '}
      {onRetry && (
        <button
          className="alert-link border-0 bg-transparent p-0"
          type="button"
          onClick={onRetry}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
