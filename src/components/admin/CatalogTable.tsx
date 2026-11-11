import Image from "next/image";
import Link from "next/link";
import { Pencil, Star, Trash2 } from "lucide-react";
import { MEDIA_TYPES, PUBLISH_STATUSES, TYPE_TONE } from "@/lib/constants";
import type { Stats } from "@/lib/data";
import type { Media, PublishStatus } from "@/types";
import { deleteMedia } from "@/app/(admin)/admin/actions";

const STATUS_TONE: Record<PublishStatus, string> = {
  published: "bg-secondary/15 text-secondary",
  draft: "bg-surface-highest text-ink-muted",
  review: "bg-tertiary/15 text-tertiary",
};

export default function CatalogTable({ rows, stats }: { rows: Media[]; stats: Map<string, Stats> }) {
  if (rows.length === 0) {
    return <p className="p-10 text-center text-sm text-ink-muted">Nenhuma obra encontrada.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-bg text-[11px] font-bold uppercase tracking-label text-ink-dim">
          <tr>
            <th className="px-6 py-3">Capa</th>
            <th className="px-3 py-3">Título &amp; Subtítulo</th>
            <th className="px-3 py-3">Tipo</th>
            <th className="px-3 py-3">Gênero</th>
            <th className="px-3 py-3">Ano</th>
            <th className="px-3 py-3 text-right">Avaliação</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-6 py-3"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-high">
          {rows.map((m) => {
            const st = stats.get(m.id);
            const status = m.publish_status ?? "published";
            return (
              <tr key={m.id} className="transition hover:bg-surface-high/60">
                <td className="px-6 py-3">
                  <div className="relative h-16 w-11 overflow-hidden rounded bg-surface-high">
                    {m.cover_url && <Image src={m.cover_url} alt="" fill sizes="44px" className="object-cover" />}
                  </div>
                </td>
                <td className="max-w-[260px] px-3 py-3">
                  <p className="truncate text-base font-bold">{m.title}</p>
                  <p className="truncate text-xs text-ink-dim">
                    {[m.subtitle, m.total_units ? `${m.total_units} ${m.type === "manga" ? "caps" : "eps"}` : null].filter(Boolean).join(" • ") || "—"}
                    {" • "}<span className="font-mono">#RTM-{m.id.slice(0, 4).toUpperCase()}</span>
                  </p>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-label ${TYPE_TONE[m.type]}`}>{MEDIA_TYPES[m.type]}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(m.genres ?? []).slice(0, 3).map((g) => <span key={g} className="rounded bg-surface-high px-1.5 py-0.5 text-xs text-ink-muted">{g}</span>)}
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{m.release_year ?? "—"}</td>
                <td className="px-3 py-3 text-right">
                  {st?.avg != null ? (
                    <span className="inline-flex items-center gap-1 rounded bg-tertiary/10 px-2 py-1 font-mono text-xs font-bold text-tertiary">
                      <Star aria-hidden className="size-3" /> {st.avg.toFixed(1)} <span className="font-normal text-ink-dim">({st.count})</span>
                    </span>
                  ) : <span className="text-xs text-ink-dim">—</span>}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONE[status]}`}>
                    <span aria-hidden className="size-1.5 rounded-full bg-current" />{PUBLISH_STATUSES[status]}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/catalogo/${m.id}`} aria-label={`Editar ${m.title}`} className="rounded p-2 text-ink-muted hover:bg-surface-highest hover:text-ink"><Pencil aria-hidden className="size-4" /></Link>
                    <form action={deleteMedia}>
                      <input type="hidden" name="id" value={m.id} />
                      <button aria-label={`Excluir ${m.title}`} className="rounded p-2 text-ink-muted hover:bg-danger-container/40 hover:text-danger"><Trash2 aria-hidden className="size-4" /></button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
