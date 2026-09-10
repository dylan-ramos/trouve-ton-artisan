interface RatingProps {
  value: number;
}

export function Rating({ value }: RatingProps) {
  const boundedValue = Math.min(5, Math.max(0, value));
  const roundedValue = Math.round(boundedValue);
  const label = `${boundedValue.toLocaleString('fr-FR')} sur 5`;

  return (
    <span className="rating" role="img" aria-label={`Note : ${label}`}>
      <span className="rating__stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) =>
          index < roundedValue ? '★' : '☆',
        ).join('')}
      </span>
      <span className="rating__value">{label}</span>
    </span>
  );
}
