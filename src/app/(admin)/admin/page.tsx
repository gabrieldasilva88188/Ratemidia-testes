import Link from "next/link";
import { BookOpen, ClipboardList, MessageSquareWarning, PlusCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { mediaStats } from "@/lib/data";
import CatalogTable from "@/components/admin/CatalogTable";
import type { Media } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = await createClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const head = { count: "exact" as const, head: true };

  const t0 = performance.now();
  const totalRes = await supabase.from("media").select("id", head);
  const latency = Math.round(performance.now() - t0);

  const [monthRes, pendingRes, libReviews, campReviews, usersRes, adminsRes, recent] = await Promise.all([
    supabase.from("media").select("id", head).gte("created_at", monthStart),
    supabase.from("media").select("id", head).neq("publish_status", "published"),
    supabase.from("library_entries").select("id", head).not("review", "is", null),
    supabase.from("campaign_reviews").select("id", head).not("comment", "is", null),
    supabase.from("profiles").select("id", head),
    supabase.from("profiles").select("id", head).eq("role", "admin"),
    supabase.from("media").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const rows = (recent.data ?? []) as Media[];
  const stats = await mediaStats(rows.map((m) => m.id));
  const reviews = (libReviews.count ?? 0) + (campReviews.count ?? 0);

  const kpis = [
    { icon: BookOpen, tone: "bg-surface-highest text-primary", label: "Total de obras indexadas", value: totalRes.count ?? 0, badge: `+${monthRes.count ?? 0} este mês`, badgeTone: "bg-secondary/15 text-secondary", foot: "Animes, Mangás, Séries e Filmes", href: "/admin/catalogo", cta: "Ver catálogo" },
    { icon: ClipboardList, tone: "bg-tertiary-strong/30 text-tertiary", label: "Rascunhos e em revisão", value: pendingRes.count ?? 0, badge: (pendingRes.count ?? 0) > 0 ? "Requer triagem" : "Em dia", badgeTone: "bg-tertiary/15 text-tertiary", foot: "Aguardando publicação", href: "/admin/catalogo?status=review", cta: "Ver fila" },
    { icon: MessageSquareWarning, tone: "bg-danger-container/50 text-danger", label: "Reviews e comentários", value: reviews, badge: "Moderação", badgeTone: "bg-danger-container/40 text-danger", foot: "Obras e campanhas de RPG", href: "/admin/moderacao", cta: "Moderar" },
    { icon: Users, tone: "bg-surface-highest text-secondary", label: "Usuários cadastrados", value: usersRes.count ?? 0, badge: `${adminsRes.count ?? 0} admin`, badgeTone: "bg-secondary/15 text-secondary", foot: "Contas ativas na plataforma", href: "/admin/usuarios", cta: "Gerenciar" },
  ];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-label text-secondary">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" /> Operações do sistema
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">Painel de Administração</h1>
          <p className="mt-1 text-ink-muted">Controle unificado de acervo multimídia, curadoria editorial e moderação da comunidade.</p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-2 text-xs">
          <p className="text-ink-dim">Latência do Banco</p>
          <p className="font-mono font-bold text-secondary">{latency}ms • {latency < 500 ? "Saudável" : "Lento"}</p>
        </div>
      </header>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between">
              <span className={`flex size-12 items-center justify-center rounded-xl ${k.tone}`}><k.icon aria-hidden className="size-6" /></span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${k.badgeTone}`}>{k.badge}</span>
            </div>
            <div>
              <p className="text-4xl font-extrabold tabular-nums">{k.value.toLocaleString("pt-BR")}</p>
              <p className="label mt-1 text-ink-muted">{k.label}</p>
            </div>
            <div className="mt-auto flex items-center justify-between text-xs text-ink-dim">
              <span>{k.foot}</span>
              <Link href={k.href} className="font-bold text-primary hover:text-secondary">{k.cta} →</Link>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <h2 className="text-2xl font-bold">Cadastros recentes</h2>
            <p className="text-sm text-ink-muted">As últimas obras adicionadas ao catálogo.</p>
          </div>
          <Link href="/admin/catalogo/nova" className="btn-primary gap-2"><PlusCircle aria-hidden className="size-4" /> Cadastrar Nova Obra</Link>
        </div>
        <CatalogTable rows={rows} stats={stats} />
      </section>
    </>
  );
}
