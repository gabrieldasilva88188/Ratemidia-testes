"use client";

import { useState } from "react";
import { PenLine, Send, Star } from "lucide-react";

export default function ReviewForm({
  action,
  rating,
  review,
  spoilers,
}: {
  action: (formData: FormData) => void | Promise<void>;
  rating: number | null; // escala 1–10
  review: string | null;
  spoilers: boolean;
}) {
  const [score, setScore] = useState(rating ?? 0);

  return (
    <form id="avaliar" action={action} className="space-y-4 rounded-xl bg-surface p-6 scroll-mt-24">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.5px]">
          <PenLine aria-hidden className="size-5 text-tertiary" />
          Avaliar e Escrever Crítica
        </h2>
        <p className="text-xs text-ink-dim">
          Sua avaliação ajuda a calcular o ranking mundial do RateMedia.
        </p>
      </div>

      <div className="rounded-lg bg-surface-low p-4">
        <p className="text-xs font-medium">Sua Nota (1 a 10)</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input type="hidden" name="rating" value={score || ""} />
          <div className="flex" role="radiogroup" aria-label="Nota de 1 a 10">
            {Array.from({ length: 10 }).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={score === n}
                  aria-label={`Nota ${n}`}
                  onClick={() => setScore(n === score ? 0 : n)}
                  className="p-0.5"
                >
                  <Star
                    className={`size-5 ${n <= score ? "fill-tertiary text-tertiary" : "text-ink-dim hover:text-tertiary"}`}
                  />
                </button>
              );
            })}
          </div>
          <span className="rounded bg-surface-high px-2 py-0.5 text-lg font-bold text-primary">
            {score || "--"}
            <span className="text-xs text-ink-dim">/10</span>
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="review" className="text-xs font-medium">
          Comentário ou Ensaio Crítico
        </label>
        <textarea
          id="review"
          name="review"
          rows={4}
          defaultValue={review ?? ""}
          placeholder="O que você achou do ritmo, da trilha sonora, da direção e dos personagens? (Spoilers devem ser marcados)"
          className="input !bg-surface-low text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-dim">
          <input
            type="checkbox"
            name="spoilers"
            defaultChecked={spoilers}
            className="size-4 rounded border-line bg-surface-low accent-primary"
          />
          Contém spoilers da história
        </label>
        <div className="flex items-center gap-2">
          <button type="reset" onClick={() => setScore(rating ?? 0)} className="rounded px-4 py-1.5 text-xs font-semibold hover:bg-surface-high">
            Limpar
          </button>
          <button className="btn-primary !py-1.5 !text-xs">
            <Send aria-hidden className="size-3.5" />
            Publicar Avaliação
          </button>
        </div>
      </div>
    </form>
  );
}
