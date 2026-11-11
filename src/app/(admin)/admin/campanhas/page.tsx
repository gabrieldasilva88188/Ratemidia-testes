import Link from "next/link";
import { Eye, Pencil, PlusCircle, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { campaignStats } from "@/lib/data";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import { monthYear } from "@/lib/format";
import type { Campaign } from "@/types";
import { deleteCampaign } from "@/app/(site)/campanhas/actions";

export const dynamic = "force-dynamic";

type Row = Campaign & { profiles: { username: string } | { username: string }[] | null };

export default async function AdminCampaignsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Row[];
  const stats = await campaignStats(rows.map((c) => c.id));
  const author = (c: Row) => (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles)?.username ?? "—";

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Campanhas de RPG</h1>
          <p className="text-ink-muted">Edite ou exclua qualquer campanha cadastrada pela comunidade.</p>
        </div>
        <Link href="/campanhas/nova" className="btn-primary gap-2"><PlusCircle aria-hidden className="size-4" /> Nova campanha</Link>
      </header>

      <section className="overflow-x-auto rounded-3xl border border-line bg-surface">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-muted">Nenhuma campanha cadastrada.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-bg text-[11px] font-bold uppercase tracking-label text-ink-dim">
              <tr>
                <th className="px-6 py-3">Campanha</th>
                <th className="px-3 py-3">Sistema</th>
                <th className="px-3 py-3">Mestre</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Avaliação</th>
                <th className="px-3 py-3">Criada em</th>
                <th className="px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-high">
              {rows.map((c) => {
                const st = stats.get(c.id);
                return (
                  <tr key={c.id} className="hover:bg-surface-high/60">
                    <td className="max-w-[260px] truncate px-6 py-3 font-bold">{c.title}</td>
                    <td className="px-3 py-3"><span className="rounded border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-label text-emerald-300">{c.system}</span></td>
                    <td className="px-3 py-3 text-ink-muted">@{author(c)}</td>
                    <td className="px-3 py-3 text-ink-muted">{CAMPAIGN_STATUSES[c.status]}</td>
                    <td className="px-3 py-3 text-right">
                      {st?.avg != null ? (
                        <span className="inline-flex items-center gap-1 rounded bg-tertiary/10 px-2 py-1 font-mono text-xs font-bold text-tertiary">
                          <Star aria-hidden className="size-3" /> {st.avg.toFixed(1)} <span className="font-normal text-ink-dim">({st.count})</span>
                        </span>
                      ) : <span className="text-xs text-ink-dim">—</span>}
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{monthYear(c.created_at)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/campanhas/${c.id}`} aria-label={`Ver ${c.title}`} className="rounded p-2 text-ink-muted hover:bg-surface-highest hover:text-ink"><Eye aria-hidden className="size-4" /></Link>
                        <Link href={`/campanhas/${c.id}/editar`} aria-label={`Editar ${c.title}`} className="rounded p-2 text-ink-muted hover:bg-surface-highest hover:text-ink"><Pencil aria-hidden className="size-4" /></Link>
                        <form action={deleteCampaign}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="redirect_to" value="/admin/campanhas" />
                          <button aria-label={`Excluir ${c.title}`} className="rounded p-2 text-ink-muted hover:bg-danger-container/40 hover:text-danger"><Trash2 aria-hidden className="size-4" /></button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
