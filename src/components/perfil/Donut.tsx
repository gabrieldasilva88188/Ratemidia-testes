const COLORS = ["#d0bcff", "#ffb95f", "#7bd0ff", "#958ea0", "#34d399", "#f472b6"];

export interface Slice {
  label: string;
  value: number;
}

/** Rosca em conic-gradient (sem dependências de gráfico). */
export default function Donut({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const stops = slices.map((s, i) => {
    const start = (acc / total) * 100;
    acc += s.value;
    return `${COLORS[i % COLORS.length]} ${start}% ${(acc / total) * 100}%`;
  });

  return (
    <div className="flex flex-wrap items-center gap-8">
      <div
        role="img"
        aria-label={`Distribuição: ${slices.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}`}
        className="relative size-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-3xl font-extrabold text-secondary">{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-label text-ink-dim">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 font-semibold">{s.label}</span>
            <span className="font-bold text-ink-muted">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
