import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, PlusCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { mediaStats } from "@/lib/data";
import { MEDIA_TYPES, PUBLISH_STATUSES } from "@/lib/constants";
import { buildQuery, pageWindow } from "@/lib/search";
import CatalogTable from "@/components/admin/CatalogTable";
import type { Media, MediaType, PublishStatus } from "@/types";

export const dynamic = "force-dynamic";
const SIZE = 10;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; status?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().replace(/[%,]/g, " ");
  const tipo = sp.tipo && sp.tipo in MEDIA_TYPES ? (sp.tipo as MediaType) : "";
  const status = sp.status && sp.status in PUBLISH_STATUSES ? (sp.status as PublishStatus) : "";
  const page = Math.max(1, Number(sp.pagina) || 1);

  const supabase = await createClient();
  let query = supabase.from("media").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (tipo) query = query.eq("type", tipo);
  if (status) query = query.eq("publish_status", status);
  const { data, count } = await query.range((page - 1) * SIZE, page * SIZE - 1);

  const rows = (data ?? []) as Media[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const stats = await mediaStats(rows.map((m) => m.id));
  const link = (n: number) => `/admin/catalogo${buildQuery({ q: sp.q, tipo, status, pagina: n > 1 ? String(n) : "" })}`;

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Gestão do Catálogo Multimídia</h1>
            <p className="text-sm text-ink-muted">Cadastro, edição e curadoria de obras do catálogo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/catalogo/importar" className="btn-ghost gap-2 border border-line"><Download aria-hidden className="size-4" /> Importar obras</Link>
            <Link href="/admin/catalogo/nova" className="btn-primary gap-2"><PlusCircle aria-hidden className="size-4" /> Cadastrar Nova Obra</Link>
          </div>
        </div>

        <form method="get" className="flex flex-wrap gap-3">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Buscar por título</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por título…" className="input h-11 pl-10" />
          </label>
          <select name="tipo" defaultValue={tipo} aria-label="Tipo" className="input h-11 w-auto">
            <option value="">Tipo: Todos os Formatos</option>
            {Object.entries(MEDIA_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="status" defaultValue={status} aria-label="Status" className="input h-11 w-auto">
            <option value="">Qualquer status</option>
            {Object.entries(PUBLISH_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn-ghost h-11 border border-line">Filtrar</button>
        </form>
      </div>

      <CatalogTable rows={rows} stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-high p-4 text-sm text-ink-muted">
        <p>
          Exibindo <strong className="text-ink">{total === 0 ? 0 : (page - 1) * SIZE + 1}–{(page - 1) * SIZE + rows.length}</strong> de <strong className="text-ink">{total.toLocaleString("pt-BR")}</strong> obras
        </p>
        <nav aria-label="Paginação" className="flex items-center gap-1">
          {page > 1 ? <Link aria-label="Anterior" href={link(page - 1)} className="rounded p-2 hover:bg-surface-high"><ChevronLeft aria-hidden className="size-4" /></Link> : <span className="p-2 opacity-30"><ChevronLeft aria-hidden className="size-4" /></span>}
          {pageWindow(page, pages).map((n, i) => n === "…" ? <span key={`e${i}`} className="px-1">…</span> : (
            <Link key={n} href={link(n)} aria-current={n === page ? "page" : undefined} className={`flex size-9 items-center justify-center rounded-lg font-bold ${n === page ? "bg-primary-strong text-primary-on" : "hover:bg-surface-high"}`}>{n}</Link>
          ))}
          {page < pages ? <Link aria-label="Próxima" href={link(page + 1)} className="rounded p-2 hover:bg-surface-high"><ChevronRight aria-hidden className="size-4" /></Link> : <span className="p-2 opacity-30"><ChevronRight aria-hidden className="size-4" /></span>}
        </nav>
      </div>
    </section>
  );
}
