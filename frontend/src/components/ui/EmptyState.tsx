interface EmptyStateProps {
  title: string;
  children: string;
  headingLevel?: 2 | 3;
}

export function EmptyState({
  title,
  children,
  headingLevel = 3,
}: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="empty-state" role="status">
      <Heading className="h5">{title}</Heading>
      <p className="mb-0">{children}</p>
    </div>
  );
}
