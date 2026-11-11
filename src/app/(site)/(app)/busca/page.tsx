import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Search, X } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { campaignStats, mediaStats } from "@/lib/data";
import { GENRES, MEDIA_TYPES, USER_STATUSES, statusLabel, STATUS_DOT } from "@/lib/constants";
import { DEMO_POPULAR, DEMO_TRENDING } from "@/lib/demo-data";
import {
  PAGE_SIZE,
  SORTS,
  buildQuery,
  filterItems,
  pageWindow,
  paginate,
  sortItems,
  type SearchItem,
  type SortKey,
} from "@/lib/search";
import SearchResultCard from "@/components/busca/SearchResultCard";
import RatingRange from "@/components/busca/RatingRange";
import type { Campaign, Media, MediaType, UserStatus } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Busca & Curadoria · RateMedia" };

type Params = {
  q?: string;
  tipo?: string;
  status?: string;
  min?: string;
  max?: string;
  genero?: string | string[];
  de?: string;
  ate?: string;
  ordem?: string;
  pagina?: string;
};

const asArray = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tipo = sp.tipo ?? "";
  const status = USER_STATUSES.includes(sp.status as UserStatus) ? (sp.status as UserStatus) : "";
  const min = Math.min(5, Math.max(0, Number(sp.min) || 0));
  const max = Math.min(5, Math.max(0, sp.max ? Number(sp.max) : 5));
  const genres = asArray(sp.genero).filter((g) => (GENRES as readonly string[]).includes(g));
  const from = Number(sp.de) || null;
  const to = Number(sp.ate) || null;
  const sort: SortKey = SORTS.some((s) => s.key === sp.ordem) ? (sp.ordem as SortKey) : "rating";

  let items: SearchItem[] = [];
  const counts: Record<string, number> = {};

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const ilike = `%${q.replace(/[%,]/g, " ")}%`;

    // Contagem por tipo (respeita o termo de busca) para a barra lateral.
    const countFor = async (t: MediaType) => {
      let c = supabase.from("media").select("id", { count: "exact", head: true }).eq("type", t);
      if (q) c = c.ilike("title", ilike);
      return (await c).count ?? 0;
    };
    const countRpg = async () => {
      let c = supabase.from("campaigns").select("id", { count: "exact", head: true });
      if (q) c = c.or(`title.ilike.${ilike},system.ilike.${ilike}`);
      return (await c).count ?? 0;
    };
    const [typeCounts, rpgCount] = await Promise.all([
      Promise.all((Object.keys(MEDIA_TYPES) as MediaType[]).map(async (t) => [t, await countFor(t)] as const)),
      countRpg(),
    ]);
    typeCounts.forEach(([t, n]) => (counts[t] = n));
    counts.rpg = rpgCount;

    if (tipo !== "rpg") {
      let query = supabase.from("media").select("*").limit(500);
      if (q) query = query.ilike("title", ilike);
      if (tipo in MEDIA_TYPES) query = query.eq("type", tipo as MediaType);
      if (from) query = query.gte("release_year", from);
      if (to) query = query.lte("release_year", to);
      const { data } = await query;
      let media = ((data ?? []) as Media[]).filter((m) => (m.publish_status ?? "published") === "published");

      if (status) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: entries } = await supabase
            .from("library_entries")
            .select("media_id")
            .eq("user_id", user.id)
            .eq("status", status);
          const ids = new Set((entries ?? []).map((e) => e.media_id));
          media = media.filter((m) => ids.has(m.id));
        } else {
          media = [];
        }
      }

      const stats = await mediaStats(media.map((m) => m.id));
      items.push(
        ...media.map<SearchItem>((m) => ({
          key: `m-${m.id}`,
          href: `/obras/${m.id}`,
          kind: m.type,
          title: m.title,
          cover: m.cover_url,
          year: m.release_year,
          subtitle: m.subtitle ?? (m.total_units ? `${m.total_units} ${m.type === "manga" ? "caps" : "eps"}` : ""),
          genres: m.genres ?? [],
          rating: stats.get(m.id)?.avg ?? null,
          votes: stats.get(m.id)?.count ?? 0,
          createdAt: m.created_at ?? "",
        })),
      );
    }

    // Campanhas não têm status pessoal, gênero nem tipo de mídia.
    if ((tipo === "" || tipo === "rpg") && !status && genres.length === 0) {
      let query = supabase.from("campaigns").select("*").limit(200);
      if (q) query = query.or(`title.ilike.${ilike},system.ilike.${ilike}`);
      const { data } = await query;
      const campaigns = (data ?? []) as Campaign[];
      const stats = await campaignStats(campaigns.map((c) => c.id));
      items.push(
        ...campaigns
          .filter((c) => (!from || new Date(c.created_at).getFullYear() >= from) && (!to || new Date(c.created_at).getFullYear() <= to))
          .map<SearchItem>((c) => ({
            key: `c-${c.id}`,
            href: `/campanhas/${c.id}`,
            kind: "rpg",
            title: c.title,
            cover: c.cover_url,
            year: new Date(c.created_at).getFullYear(),
            subtitle: c.system,
            genres: [],
            rating: stats.get(c.id)?.avg ?? null,
            votes: stats.get(c.id)?.count ?? 0,
            createdAt: c.created_at,
          })),
      );
    }
  } else {
    // Sem Supabase configurado: catálogo de demonstração do Figma.
    const demo = [...DEMO_TRENDING, ...DEMO_POPULAR].map<SearchItem>((p) => ({
      key: `d-${p.title}`,
      href: null,
      kind: p.category,
      title: p.title,
      cover: p.cover ?? null,
      year: p.year ?? null,
      subtitle: p.subtitle ?? "",
      genres: [],
      rating: p.rating,
      votes: 0,
      createdAt: "",
    }));
    demo.forEach((d) => (counts[d.kind] = (counts[d.kind] ?? 0) + 1));
    items = demo.filter(
      (d) =>
        (!q || d.title.toLowerCase().includes(q.toLowerCase())) && (!tipo || d.kind === tipo),
    );
  }

  const filtered = sortItems(filterItems(items, { min, max, genres }), sort);
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const view = paginate(filtered, Number(sp.pagina) || 1);

  // URL base preservando todos os filtros atuais.
  const base = { q, tipo, status, min: min ? String(min) : "", max: max < 5 ? String(max) : "", genero: genres, de: from ? String(from) : "", ate: to ? String(to) : "", ordem: sort === "rating" ? "" : sort };
  const href = (over: Partial<Record<keyof typeof base | "pagina", string | string[]>>) =>
    `/busca${buildQuery({ ...base, ...over, pagina: over.pagina ?? "" })}`;

  const chips: { label: string; remove: string }[] = [];
  if (tipo) chips.push({ label: `Tipo: ${tipo === "rpg" ? "Campanhas RPG" : MEDIA_TYPES[tipo as MediaType] ?? tipo}`, remove: href({ tipo: "" }) });
  if (status) chips.push({ label: `Status: ${statusLabel(status, "anime")}`, remove: href({ status: "" }) });
  if (min > 0) chips.push({ label: `Nota: ≥${min.toFixed(1)}`, remove: href({ min: "" }) });
  genres.forEach((g) => chips.push({ label: `Gênero: ${g}`, remove: href({ genero: genres.filter((x) => x !== g) }) }));
  if (from || to) chips.push({ label: `Período: ${from ?? "…"}–${to ?? "…"}`, remove: href({ de: "", ate: "" }) });

  const currentYear = new Date().getFullYear();
  const typeRows: { value: string; label: string; dot: string }[] = [
    { value: "", label: "Todos os Tipos", dot: "" },
    { value: "anime", label: "Animes", dot: "bg-pink-400" },
    { value: "manga", label: "Mangás", dot: "bg-orange-400" },
    { value: "movie", label: "Filmes", dot: "bg-secondary" },
    { value: "series", label: "Séries", dot: "bg-primary" },
    { value: "rpg", label: "Campanhas RPG", dot: "bg-emerald-400" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-6 py-8">
      {/* Cabeçalho de busca */}
      <section className="rounded-3xl border border-line bg-gradient-to-br from-surface to-bg-soft p-6">
        <p className="label text-ink-dim">
          Catálogo Global / <span className="text-secondary">Busca &amp; Curadoria</span>
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar por título ou sistema</span>
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
            <input
              form="filtros"
              name="q"
              defaultValue={q}
              placeholder="Título, sistema de RPG..."
              className="h-14 w-full rounded-xl border border-line bg-bg-soft pl-12 pr-12 text-xl font-semibold placeholder:text-ink-dim focus:border-primary focus:outline-none"
            />
            {q && (
              <Link href={href({ q: "" })} aria-label="Limpar busca" className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink">
                <X aria-hidden className="size-4" />
              </Link>
            )}
          </label>
          <button form="filtros" className="btn-primary h-14 gap-2 px-8 text-base">
            <SlidersHorizontal aria-hidden className="size-4" /> Pesquisar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg">
            <strong className="font-extrabold">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "obra encontrada" : "obras encontradas"}
            {q && (
              <>
                {" "}para o termo{" "}
                <span className="rounded bg-secondary/15 px-2 py-0.5 font-semibold text-secondary">“{q}”</span>
              </>
            )}
          </p>
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="label text-ink-dim">Filtros ativos:</span>
              {chips.map((c) => (
                <Link key={c.label} href={c.remove} className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 font-semibold hover:border-primary">
                  {c.label} <X aria-hidden className="size-3 text-ink-dim" />
                </Link>
              ))}
              <Link href={q ? `/busca${buildQuery({ q })}` : "/busca"} className="font-bold text-secondary hover:underline">
                Redefinir tudo
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[272px_1fr]">
        {/* Filtros avançados (formulário GET) */}
        <aside>
          <form id="filtros" method="get" className="space-y-6 rounded-3xl border border-line bg-surface p-5 lg:sticky lg:top-20">
            <input type="hidden" name="ordem" value={sort === "rating" ? "" : sort} />
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><SlidersHorizontal aria-hidden className="size-4" /> Filtros Avançados</h2>
              <Link href={q ? `/busca${buildQuery({ q })}` : "/busca"} className="label text-ink-dim hover:text-ink">Limpar</Link>
            </div>

            <fieldset className="space-y-1">
              <legend className="label mb-2 text-ink-dim">Tipo de mídia</legend>
              {typeRows.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-high has-[:checked]:bg-surface-high">
                  <input type="radio" name="tipo" value={r.value} defaultChecked={tipo === r.value} className="size-4 accent-primary-strong" />
                  {r.dot && <span aria-hidden className={`size-1.5 rounded-full ${r.dot}`} />}
                  <span className="flex-1">{r.label}</span>
                  <span className="text-[11px] text-ink-dim">{r.value ? counts[r.value] ?? 0 : totalAll}</span>
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend className="label mb-2 flex w-full justify-between text-ink-dim">
                <span>Gêneros &amp; Nicho</span>
                <span className="normal-case tracking-normal">{genres.length} selecionados</span>
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <label key={g} className="cursor-pointer">
                    <input type="checkbox" name="genero" value={g} defaultChecked={genres.includes(g)} className="peer sr-only" />
                    <span className="block rounded bg-surface-high px-2.5 py-1 text-xs font-semibold text-ink-muted transition peer-checked:bg-primary-strong peer-checked:text-primary-on peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                      {g}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label mb-2 text-ink-dim">Status pessoal</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {USER_STATUSES.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name="status" value={s} defaultChecked={status === s} className="peer sr-only" />
                    <span className="flex items-center gap-2 rounded-lg bg-surface-high px-2.5 py-1.5 text-xs font-bold peer-checked:ring-1 peer-checked:ring-primary">
                      <span aria-hidden className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
                      {statusLabel(s, "anime")}
                    </span>
                  </label>
                ))}
              </div>
              {status && (
                <label className="mt-2 flex items-center gap-2 text-xs text-ink-dim">
                  <input type="radio" name="status" value="" className="accent-primary-strong" /> Qualquer status
                </label>
              )}
            </fieldset>

            <RatingRange name="min" defaultValue={min} />

            <fieldset>
              <legend className="label mb-2 text-ink-dim">Período / Lançamento</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-ink-dim">De
                  <input name="de" type="number" min={1900} max={currentYear} defaultValue={from ?? ""} placeholder="1990" className="input mt-1" />
                </label>
                <label className="text-xs text-ink-dim">Até
                  <input name="ate" type="number" min={1900} max={currentYear} defaultValue={to ?? ""} placeholder={String(currentYear)} className="input mt-1" />
                </label>
              </div>
            </fieldset>

            <button className="btn-primary w-full">Aplicar Filtros</button>
          </form>
        </aside>

        {/* Resultados */}
        <section className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <nav aria-label="Ordenar por" className="flex flex-wrap items-center gap-1">
              <span className="label mr-2 text-ink-dim">Ordenar por:</span>
              {SORTS.map((s) => (
                <Link
                  key={s.key}
                  href={href({ ordem: s.key === "rating" ? "" : s.key })}
                  aria-current={sort === s.key ? "true" : undefined}
                  className={`rounded px-3 py-1 text-xs font-bold transition ${sort === s.key ? "bg-surface-highest text-ink" : "text-ink-muted hover:bg-surface-high"}`}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
            <span className="text-xs text-ink-dim">Página {view.page} de {view.pages}</span>
          </div>

          {view.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {view.items.map((i) => (
                <SearchResultCard key={i.key} item={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-12 text-center">
              <p className="font-bold">Nada encontrado com esses filtros.</p>
              <p className="mt-1 text-sm text-ink-muted">Tente remover algum filtro ou buscar por outro termo.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
              <p>
                Exibindo <strong className="text-ink">{(view.page - 1) * PAGE_SIZE + 1}–{(view.page - 1) * PAGE_SIZE + view.items.length}</strong> de{" "}
                <strong className="text-ink">{filtered.length}</strong> resultados
              </p>
              <nav aria-label="Paginação" className="flex items-center gap-1">
                {view.page > 1 ? (
                  <Link aria-label="Página anterior" href={href({ pagina: String(view.page - 1) })} className="rounded p-2 hover:bg-surface-high"><ChevronLeft aria-hidden className="size-4" /></Link>
                ) : (
                  <span className="p-2 opacity-30"><ChevronLeft aria-hidden className="size-4" /></span>
                )}
                {pageWindow(view.page, view.pages).map((n, idx) =>
                  n === "…" ? (
                    <span key={`e${idx}`} className="px-1">…</span>
                  ) : (
                    <Link key={n} href={href({ pagina: String(n) })} aria-current={n === view.page ? "page" : undefined}
                      className={`flex size-9 items-center justify-center rounded-lg font-bold ${n === view.page ? "bg-primary-strong text-primary-on" : "hover:bg-surface-high"}`}>
                      {n}
                    </Link>
                  ),
                )}
                {view.page < view.pages ? (
                  <Link aria-label="Próxima página" href={href({ pagina: String(view.page + 1) })} className="rounded p-2 hover:bg-surface-high"><ChevronRight aria-hidden className="size-4" /></Link>
                ) : (
                  <span className="p-2 opacity-30"><ChevronRight aria-hidden className="size-4" /></span>
                )}
              </nav>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
