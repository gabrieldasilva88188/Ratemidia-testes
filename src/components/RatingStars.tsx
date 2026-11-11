export default function RatingStars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-ink-muted">Sem nota</span>;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="text-sm text-brand" aria-label={`Nota ${value} de 5`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      <span className="ml-1 text-xs text-ink-muted">{value.toFixed(1)}</span>
    </span>
  );
}
