interface EmptyStateProps {
  title: string;
  children: string;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <h3 className="h5">{title}</h3>
      <p className="mb-0">{children}</p>
    </div>
  );
}
