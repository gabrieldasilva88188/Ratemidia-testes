"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bookmark, ListPlus, Minus, PlayCircle, Plus } from "lucide-react";
import AddToListButton from "@/components/AddToListButton";

export interface StatusOption {
  value: string;
  label: string;
}

export default function LibraryControls({
  action,
  statusOptions,
  status,
  progress,
  total,
  progressLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  statusOptions: StatusOption[];
  status: string;
  progress: number;
  total: number | null;
  progressLabel: string;
}) {
  const [value, setValue] = useState(progress);
  // A rota /obras/[id] fornece o id da obra para o modal "Adicionar à lista".
  const params = useParams<{ id?: string }>();
  const mediaId = typeof params?.id === "string" ? params.id : null;
  const clamp = (n: number) => Math.max(0, total ? Math.min(total, n) : n);
  const pct = total ? Math.round((value / total) * 100) : 0;

  return (
    <form
      action={action}
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-surface px-5 py-3"
    >
      <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-label text-ink-dim">
        Seu status:
        <select
          name="status"
          defaultValue={status}
          className="rounded bg-surface-high px-2 py-1 text-xs font-semibold normal-case tracking-normal text-ink focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3 md:mx-auto">
        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <PlayCircle aria-hidden className="size-4" />
          {progressLabel}:
        </span>
        <button
          type="button"
          aria-label="Diminuir progresso"
          onClick={() => setValue((v) => clamp(v - 1))}
          className="rounded bg-surface-high p-2 hover:bg-surface-highest"
        >
          <Minus aria-hidden className="size-3.5" />
        </button>
        <input type="hidden" name="progress" value={value} />
        <span className="min-w-14 text-center">
          <span className="text-lg font-bold text-secondary">{value}</span>
          {total ? <span className="text-xs text-ink-dim"> /{total}</span> : null}
        </span>
        <button
          type="button"
          aria-label="Aumentar progresso"
          onClick={() => setValue((v) => clamp(v + 1))}
          className="rounded bg-surface-high p-2 hover:bg-surface-highest"
        >
          <Plus aria-hidden className="size-3.5" />
        </button>
        {total ? (
          <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-surface-highest sm:block">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        <AddToListButton
          mediaId={mediaId}
          className="inline-flex items-center gap-1 rounded bg-surface-high px-3 py-1.5 text-xs font-semibold hover:bg-surface-highest"
        >
          <ListPlus aria-hidden className="size-3.5" />
          Adicionar à lista
        </AddToListButton>
        <button className="btn-primary !py-1.5 !text-xs">
          <Bookmark aria-hidden className="size-3.5" />
          Salvar na biblioteca
        </button>
      </div>
    </form>
  );
}
