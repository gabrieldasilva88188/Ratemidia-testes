import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { clearLibraryReview, deleteCampaignReview } from "../actions";

export const dynamic = "force-dynamic";

type Row = { id: string; text: string; rating: number | null; who: string; where: string; at: string };

export default async function ModerationPage() {
  const supabase = await createClient();
  const [{ data: lib }, { data: camp }] = await Promise.all([
    supabase
      .from("library_entries")
      .select("id, review, rating, updated_at, profiles(username), media(title)")
      .not("review", "is", null)
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("campaign_reviews")
      .select("id, comment, rating, created_at, profiles(username), campaigns(title)")
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
  const libRows: Row[] = (lib ?? []).map((r) => ({
    id: r.id, text: r.review ?? "", rating: r.rating, at: r.updated_at,
    who: one(r.profiles as { username: string } | { username: string }[] | null)?.username ?? "—",
    where: one(r.media as { title: string } | { title: string }[] | null)?.title ?? "—",
  }));
  const campRows: Row[] = (camp ?? []).map((r) => ({
    id: r.id, text: r.comment ?? "", rating: Number(r.rating), at: r.created_at,
    who: one(r.profiles as { username: string } | { username: string }[] | null)?.username ?? "—",
    where: one(r.campaigns as { title: string } | { title: string }[] | null)?.title ?? "—",
  }));

  const Block = ({ title, rows, action, label }: { title: string; rows: Row[]; action: (f: FormData) => Promise<void>; label: string }) => (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface">
      <h2 className="p-6 text-2xl font-bold">{title} <span className="text-base font-normal text-ink-dim">({rows.length})</span></h2>
      {rows.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-ink-muted">Nada para moderar.</p>
      ) : (
        <ul className="divide-y divide-surface-high">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs text-ink-dim">
                  <strong className="text-ink">@{r.who}</strong> em <strong className="text-ink">{r.where}</strong> · {timeAgo(r.at)}
                  {r.rating !== null && <> · ★ {r.rating.toFixed(1)}</>}
                </p>
                <p className="text-sm text-ink-muted">“{r.text}”</p>
              </div>
              <form action={action}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn bg-danger-container/40 text-danger hover:bg-danger-container/70">{label}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Moderação de Reviews</h1>
        <p className="text-ink-muted">Remova comentários inadequados. Em resenhas de obras, apenas o texto é apagado (a nota é mantida).</p>
      </header>
      <Block title="Comentários de campanhas de RPG" rows={campRows} action={deleteCampaignReview} label="Remover" />
      <Block title="Resenhas de obras" rows={libRows} action={clearLibraryReview} label="Apagar texto" />
    </>
  );
}
