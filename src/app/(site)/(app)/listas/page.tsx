import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, BookMarked, Calendar, Globe, ListPlus, Lock, MapPin, MessageSquare, Pencil, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_TYPES, STATUS_DOT, USER_STATUSES, statusLabel } from "@/lib/constants";
import { monthYear, timeAgo } from "@/lib/format";
import Donut, { type Slice } from "@/components/perfil/Donut";
import type { Media, Profile, UserStatus } from "@/types";
import { createList, updateProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil e Minhas Listas · RateMedia" };

type EntryRow = {
  status: UserStatus;
  rating: number | null;
  progress: number;
  review: string | null;
  updated_at: string;
  media: Media | null;
};
type ListRow = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  list_items: { media: { cover_url: string | null } | null }[];
};
type CampaignReviewRow = { id: string; rating: number; comment: string | null; created_at: string; campaigns: { title: string } | null };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const shelf: UserStatus = USER_STATUSES.includes(sp.status as UserStatus) ? (sp.status as UserStatus) : "in_progress";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: profile }, { data: entriesData }, { data: listsData }, { count: campaignCount }, { data: crData }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("library_entries").select("status, rating, progress, review, updated_at, media(*)").eq("user_id", user.id),
      supabase
        .from("lists")
        .select("id, title, description, is_public, created_at, list_items(media(cover_url))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase
        .from("campaign_reviews")
        .select("id, rating, comment, created_at, campaigns(title)")
        .eq("user_id", user.id)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const me = profile as Profile | null;
  const entries = ((entriesData ?? []) as unknown as EntryRow[]).filter((e) => e.media);
  const lists = (listsData ?? []) as unknown as ListRow[];
  const campaignReviews = (crData ?? []) as unknown as CampaignReviewRow[];

  const done = (t: Media["type"]) => entries.filter((e) => e.status === "completed" && e.media!.type === t).length;
  const rated = entries.filter((e) => e.rating !== null);
  const avg = rated.length ? rated.reduce((a, e) => a + (e.rating ?? 0), 0) / rated.length : null;
  const reviewCount = entries.filter((e) => e.review).length + campaignReviews.length;

  const stats = [
    { label: "Animes", value: done("anime"), unit: "assistidos", tone: "text-ink" },
    { label: "Mangás", value: done("manga"), unit: "lidos", tone: "text-ink" },
    { label: "Filmes", value: done("movie"), unit: "assistidos", tone: "text-ink" },
    { label: "Séries", value: done("series"), unit: "maratonadas", tone: "text-ink" },
    { label: "RPG Campanhas", value: campaignCount ?? 0, unit: "mesas registradas", tone: "text-tertiary" },
    { label: "Avaliações", value: reviewCount, unit: "resenhas escritas", tone: "text-secondary" },
  ];

  const shelfEntries = entries
    .filter((e) => e.status === shelf)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 12);

  // Distribuição: por gênero quando as obras têm gêneros; senão por tipo de mídia.
  const genreCount = new Map<string, number>();
  entries.forEach((e) => (e.media!.genres ?? []).forEach((g) => genreCount.set(g, (genreCount.get(g) ?? 0) + 1)));
  const byGenre = genreCount.size > 0;
  const typeCount = new Map<string, number>();
  entries.forEach((e) => typeCount.set(MEDIA_TYPES[e.media!.type], (typeCount.get(MEDIA_TYPES[e.media!.type]) ?? 0) + 1));
  const ranked = [...(byGenre ? genreCount : typeCount).entries()].sort((a, b) => b[1] - a[1]);
  const slices: Slice[] = ranked.slice(0, 3).map(([label, value]) => ({ label, value }));
  const rest = ranked.slice(3).reduce((a, [, v]) => a + v, 0);
  if (rest > 0) slices.push({ label: "Outros", value: rest });

  const feed = [
    ...entries.filter((e) => e.review).map((e) => ({
      key: `e-${e.media!.id}`, title: e.media!.title, cover: e.media!.cover_url, rating: e.rating, text: e.review!, at: e.updated_at,
    })),
    ...campaignReviews.map((r) => ({
      key: `c-${r.id}`, title: `Mesa: ${r.campaigns?.title ?? "Campanha"}`, cover: null as string | null, rating: r.rating, text: r.comment!, at: r.created_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);

  const username = me?.username ?? user.email ?? "usuário";
  const tabs = [
    { href: "#vitrine", label: "Minha Biblioteca", icon: BookMarked },
    { href: "#listas", label: "Minhas Listas", icon: ListPlus, badge: lists.length },
    { href: "#avaliacoes", label: "Avaliações Recentes", icon: MessageSquare },
    { href: "#estatisticas", label: "Estatísticas & Gráficos", icon: BarChart3 },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[#2a1760] via-surface to-[#0f4361] sm:h-72">
        {me?.banner_url && <Image src={me.banner_url} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-[1280px] space-y-10 px-6 pb-12">
        {/* Identidade */}
        <header className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">
          <div className="relative size-32 shrink-0 overflow-hidden rounded-3xl border-4 border-primary-strong/70 bg-surface-high shadow-[0_0_32px_rgba(160,120,255,0.35)] sm:size-36">
            {me?.avatar_url ? (
              <Image src={me.avatar_url} alt={`Avatar de ${username}`} fill sizes="144px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-4xl font-extrabold text-primary">{username.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{username}</h1>
              {me?.role === "admin" && (
                <span className="rounded bg-secondary-strong px-2 py-0.5 text-[11px] font-bold uppercase tracking-label text-secondary-on">Staff</span>
              )}
            </div>
            <p className="text-sm font-semibold text-secondary">@{username}</p>
            {me?.bio && <p className="max-w-2xl text-sm text-ink-muted">{me.bio}</p>}
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-dim">
              <span className="flex items-center gap-1"><Calendar aria-hidden className="size-3" /> Membro desde {me ? monthYear(me.created_at) : "—"}</span>
              {me?.location && <span className="flex items-center gap-1"><MapPin aria-hidden className="size-3" /> {me.location}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <a href="#editar" className="btn-ghost border border-line"><Pencil aria-hidden className="size-4" /> Editar Perfil</a>
            <a href="#nova-lista" className="btn-primary"><ListPlus aria-hidden className="size-4" /> Criar Nova Lista</a>
          </div>
        </header>

        {/* Estatísticas */}
        <section aria-label="Estatísticas" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
              <p className="label text-ink-dim">{s.label}</p>
              <p className={`mt-1 text-3xl font-extrabold ${s.tone}`}>{s.value}</p>
              <p className="text-xs text-ink-muted">{s.unit}</p>
            </div>
          ))}
        </section>

        {/* Abas (âncoras) */}
        <nav aria-label="Seções do perfil" className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1">
          {tabs.map((t) => (
            <a key={t.href} href={t.href} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-ink-muted transition hover:bg-surface-high hover:text-ink">
              <t.icon aria-hidden className="size-4" />
              {t.label}
              {t.badge !== undefined && <span className="rounded-full bg-surface-highest px-1.5 text-[11px]">{t.badge}</span>}
            </a>
          ))}
        </nav>

        {/* Formulários (recolhidos) */}
        <div className="grid gap-4 md:grid-cols-2">
          <details id="editar" className="rounded-2xl border border-line bg-surface p-4 open:border-primary-strong/40">
            <summary className="cursor-pointer text-sm font-bold">Editar perfil</summary>
            <form action={updateProfile} className="mt-4 grid gap-3">
              <textarea name="bio" rows={3} maxLength={300} defaultValue={me?.bio ?? ""} placeholder="Bio" className="input" />
              <input name="location" maxLength={80} defaultValue={me?.location ?? ""} placeholder="Localização" className="input" />
              <input name="avatar_url" type="url" defaultValue={me?.avatar_url ?? ""} placeholder="URL do avatar (https://…)" className="input" />
              <input name="banner_url" type="url" defaultValue={me?.banner_url ?? ""} placeholder="URL do banner (https://…)" className="input" />
              <button className="btn-primary w-fit">Salvar perfil</button>
            </form>
          </details>
          <details id="nova-lista" className="rounded-2xl border border-line bg-surface p-4 open:border-primary-strong/40">
            <summary className="cursor-pointer text-sm font-bold">Criar nova lista</summary>
            <form action={createList} className="mt-4 grid gap-3">
              <input name="title" required maxLength={80} placeholder='Ex: "Favoritos de 2026"' className="input" />
              <input name="description" maxLength={300} placeholder="Descrição (opcional)" className="input" />
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input type="checkbox" name="is_public" defaultChecked className="size-4 accent-primary-strong" /> Lista pública
              </label>
              <button className="btn-primary w-fit">Criar lista</button>
            </form>
          </details>
        </div>

        {/* Listas */}
        <section id="listas" className="scroll-mt-24 space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="border-l-4 border-primary pl-3 text-2xl font-bold">Listas Personalizadas Criadas</h2>
            <span className="label text-ink-dim">{lists.length} {lists.length === 1 ? "coleção ativa" : "coleções ativas"}</span>
          </div>
          {lists.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-ink-muted">
              Você ainda não criou listas. Use “Criar Nova Lista” para começar.
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lists.map((l) => {
                const covers = l.list_items.map((i) => i.media?.cover_url ?? null);
                const extra = Math.max(0, covers.length - 3);
                return (
                  <li key={l.id}>
                    <Link href={`/listas/${l.id}`} className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 transition hover:border-primary-strong/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 rounded border border-line bg-surface-high px-2 py-0.5 font-bold uppercase tracking-label text-secondary">
                          {l.is_public ? <Globe aria-hidden className="size-3" /> : <Lock aria-hidden className="size-3" />}
                          {l.is_public ? "Pública" : "Privada"}
                        </span>
                        <span className="text-ink-dim">{timeAgo(l.created_at)}</span>
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{l.title}</h3>
                      {l.description && <p className="line-clamp-2 text-sm text-ink-muted">{l.description}</p>}
                      <div className="mt-auto grid grid-cols-4 gap-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-high">
                            {covers[i] && <Image src={covers[i]!} alt="" fill sizes="100px" className="object-cover" />}
                          </div>
                        ))}
                        <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-surface-high text-lg font-extrabold text-tertiary">
                          {extra > 0 ? `+${extra}` : "—"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-ink-muted">{covers.length} {covers.length === 1 ? "item" : "itens"}</span>
                        <span className="flex items-center gap-1 text-primary group-hover:text-secondary">Ver lista <ArrowRight aria-hidden className="size-3" /></span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Vitrine */}
        <section id="vitrine" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="border-l-4 border-secondary pl-3 text-2xl font-bold">Vitrine da Biblioteca</h2>
              <p className="pl-4 text-sm text-ink-muted">Acompanhamento em tempo real das obras catalogadas</p>
            </div>
            <nav aria-label="Status" className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
              {USER_STATUSES.map((s) => {
                const n = entries.filter((e) => e.status === s).length;
                return (
                  <Link key={s} href={`/listas?status=${s}#vitrine`} aria-current={shelf === s ? "true" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${shelf === s ? "bg-surface-highest" : "text-ink-muted hover:bg-surface-high"}`}>
                    <span aria-hidden className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
                    {statusLabel(s, "anime")} / {statusLabel(s, "manga")}
                    <span className="text-ink-dim">{n}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          {shelfEntries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-ink-muted">Nada por aqui ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {shelfEntries.map((e) => {
                const m = e.media!;
                const pct = m.total_units ? Math.min(100, Math.round((e.progress / m.total_units) * 100)) : null;
                return (
                  <Link key={m.id} href={`/obras/${m.id}`} className="group block overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-primary-strong/40">
                    <div className="relative aspect-[2/3] bg-surface-high">
                      {m.cover_url && <Image src={m.cover_url} alt="" fill sizes="200px" className="object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
                      <span className="absolute left-2 top-2 rounded bg-bg/80 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-label text-primary">{MEDIA_TYPES[m.type]}</span>
                      {e.rating !== null && (
                        <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-bg/85 px-1.5 py-0.5 text-[11px] font-bold text-tertiary">
                          <Star aria-hidden className="size-2.5 fill-current" />{e.rating.toFixed(1)}
                        </span>
                      )}
                      {pct !== null && (
                        <div className="absolute inset-x-2 bottom-2 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold"><span>{e.progress}/{m.total_units}</span><span>{pct}%</span></div>
                          <div className="h-1 overflow-hidden rounded-full bg-surface-highest"><div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} /></div>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="line-clamp-1 text-sm font-bold">{m.title}</h3>
                      <p className="truncate text-xs text-ink-dim">{[m.subtitle, m.release_year].filter(Boolean).join(" • ") || "—"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* DNA crítico + feed */}
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <section id="estatisticas" className="scroll-mt-24 space-y-4 rounded-3xl border border-line bg-surface p-6">
            <div>
              <p className="label text-ink-dim">DNA Crítico</p>
              <h2 className="text-xl font-bold">Distribuição por {byGenre ? "Gênero" : "Tipo de mídia"}</h2>
            </div>
            {slices.length > 0 ? (
              <Donut slices={slices} centerLabel="registros" />
            ) : (
              <p className="text-sm text-ink-muted">Registre obras na biblioteca para ver sua distribuição.</p>
            )}
            <p className="flex items-center justify-between rounded-xl bg-bg-soft px-4 py-3 text-sm">
              <span className="text-ink-muted">Média geral das notas:</span>
              <span className="flex items-center gap-1 font-bold text-tertiary"><Star aria-hidden className="size-3.5 fill-current" />{avg !== null ? `${avg.toFixed(1)} / 5.0` : "—"}</span>
            </p>
          </section>

          <section id="avaliacoes" className="scroll-mt-24 space-y-4 rounded-3xl border border-line bg-surface p-6">
            <div>
              <p className="label text-ink-dim">Feed Social</p>
              <h2 className="text-xl font-bold">Avaliações &amp; Registros Recentes</h2>
            </div>
            {feed.length === 0 ? (
              <p className="text-sm text-ink-muted">Suas resenhas aparecerão aqui.</p>
            ) : (
              <ul className="space-y-3">
                {feed.map((f) => (
                  <li key={f.key} className="flex gap-3 rounded-2xl bg-bg-soft p-3">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-high">
                      {f.cover && <Image src={f.cover} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-bold">{f.title}</h3>
                        {f.rating !== null && (
                          <span className="flex items-center gap-1 rounded bg-tertiary/15 px-1.5 py-0.5 text-[11px] font-bold text-tertiary"><Star aria-hidden className="size-2.5 fill-current" />{Number(f.rating).toFixed(1)}</span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-ink-muted">“{f.text}”</p>
                      <p className="mt-1 text-xs text-ink-dim">{timeAgo(f.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
