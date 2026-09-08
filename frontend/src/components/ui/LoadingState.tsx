interface LoadingStateProps {
  label?: string;
  compact?: boolean;
}

export function LoadingState({
  label = 'Chargement en cours…',
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={`loading-state${compact ? ' loading-state--compact' : ''}`}
      role="status"
    >
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
