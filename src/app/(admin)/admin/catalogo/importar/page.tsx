import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, Download, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_TYPES, TYPE_TONE } from "@/lib/constants";
import {
  ExternalApiError,
  isTmdbConfigured,
  searchAllExternal,
  searchExternal,
  storageId,
  type ExternalMedia,
} from "@/lib/external";
import { importExternalMedia } from "../../actions";
import type { MediaType } from "@/types";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  api: "A API externa não respondeu. Tente novamente em instantes.",
  "nao-encontrada": "Obra não encontrada na API externa.",
  db: "Não foi possível salvar a obra no banco de dados.",
};

type Filter = MediaType | "all";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; ok?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const tipo: Filter = sp.tipo && sp.tipo in MEDIA_TYPES ? (sp.tipo as MediaType) : "all";
  const usesTmdb = tipo === "all" || tipo === "movie" || tipo === "series";
  const tmdbMissing = usesTmdb && !isTmdbConfigured();
  const tmdbOnly = tipo === "movie" || tipo === "series";

  let results: ExternalMedia[] = [];
  let searchError: string | null = null;
  let failed: MediaType[] = [];
  if (q && !(tmdbMissing && tmdbOnly)) {
    try {
      if (tipo === "all") {
        ({ results, failed } = await searchAllExternal(q));
        if (results.length === 0 && failed.length === 4) searchError = "Não foi possível conectar às APIs externas.";
      } else {
        results = await searchExternal(tipo, q);
      }
    } catch (e) {
      searchError = e instanceof ExternalApiError ? e.message : "Erro ao buscar na API externa.";
    }
  }

  // Marca o que já está no catálogo.
  const imported = new Set<string>();
  if (results.length) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("media")
      .select("external_source, external_id")
      .in("external_source", [...new Set(results.map((r) => r.source))])
      .in("external_id", results.map(storageId));
    (data ?? []).forEach((m) => imported.add(`${m.external_source}:${m.external_id}`));
  }

  return (
    <section className="space-y-6">
      <div>
        <Link href="/admin/catalogo" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" /> Voltar ao catálogo
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Importar obras</h1>
        <p className="text-sm text-ink-muted">
          Busque no AniList/Jikan (animes e mangás) ou no TMDB (filmes e séries) e adicione ao catálogo com um clique.
        </p>
      </div>

      {sp.ok && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 aria-hidden className="size-4" /> Obra importada para o catálogo.
        </p>
      )}
      {(sp.erro || searchError) && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">
          {searchError ?? ERRORS[sp.erro!] ?? "Erro inesperado."}
        </p>
      )}
      {tmdbMissing && (
        <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          {tipo === "all" ? "Filmes e séries foram ignorados: o TMDB não está configurado. " : "TMDB não configurado. "}
          Crie uma conta gratuita em themoviedb.org, gere o token em Configurações → API e defina{" "}
          <code>TMDB_API_READ_TOKEN</code> (ou <code>TMDB_API_KEY</code>) no <code>.env.local</code> e na Vercel.
        </p>
      )}
      {failed.length > 0 && failed.length < 4 && (
        <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          Sem resposta para: {failed.map((t) => MEDIA_TYPES[t]).join(", ")}. Mostrando os demais resultados.
        </p>
      )}

      <form method="get" className="flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Título da obra</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
          <input name="q" defaultValue={q} required placeholder="Ex.: Fullmetal Alchemist, Duna…" className="input h-11 pl-10" />
        </label>
        <select name="tipo" defaultValue={tipo} aria-label="Tipo" className="input h-11 w-auto">
          <option value="all">Qualquer mídia</option>
          {Object.entries(MEDIA_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-primary h-11">Buscar</button>
      </form>

      {q && !searchError && !(tmdbMissing && tmdbOnly) && results.length === 0 && (
        <p className="text-sm text-ink-muted">Nenhum resultado para “{q}”.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {results.map((r) => {
          const done = imported.has(`${r.source}:${storageId(r)}`);
          return (
            <li key={`${r.source}:${storageId(r)}`} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
              <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-high">
                {/* unoptimized: o navegador carrega direto do CDN, sem passar pelo servidor local (mais leve em PC lento). */}
                {r.cover_url && <Image src={r.cover_url} alt="" fill sizes="96px" unoptimized className="object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={`mb-1 w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_TONE[r.type]}`}>
                  {MEDIA_TYPES[r.type]}
                </span>
                <h2 className="truncate font-bold">{r.title}</h2>
                <p className="text-xs text-ink-muted">
                  {[r.release_year, r.subtitle, r.total_units && r.type !== "movie" ? `${r.total_units} ${r.type === "manga" ? "cap." : "ep."}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {r.synopsis && <p className="mt-1 line-clamp-3 text-xs text-ink-dim">{r.synopsis}</p>}
                <div className="mt-auto pt-3">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
                      <CheckCircle2 aria-hidden className="size-4" /> Já no catálogo
                    </span>
                  ) : (
                    <form action={importExternalMedia}>
                      <input type="hidden" name="type" value={r.type} />
                      <input type="hidden" name="source" value={r.source} />
                      <input type="hidden" name="external_id" value={r.external_id} />
                      <input type="hidden" name="tipo" value={tipo} />
                      <input type="hidden" name="q" value={q} />
                      <button className="btn-primary h-9 gap-2 text-sm">
                        <Download aria-hidden className="size-4" /> Importar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
