"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/** Slider de nota mínima (0–5) com leitura ao vivo e estrelas de apoio. */
export default function RatingRange({ name, defaultValue }: { name: string; defaultValue: number }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label text-ink-dim">Nota mínima</span>
        <span className="flex items-center gap-1 text-xs font-bold text-tertiary">
          <Star aria-hidden className="size-3 fill-current" />
          {value.toFixed(1)} / 5
        </span>
      </div>
      <input
        type="range"
        name={name}
        min={0}
        max={5}
        step={0.5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        aria-label="Nota mínima"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-highest accent-primary-strong"
      />
      <div className="flex justify-between text-[11px] font-bold text-ink-dim">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
