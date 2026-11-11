import Link from "next/link";
import { BadgeCheck, Heart, LibraryBig, MessageSquare, Star, UsersRound } from "lucide-react";
import { DEMO_CURATORS, DEMO_FEED, DEMO_LISTS } from "@/lib/demo-data";
import SectionHeading from "./SectionHeading";

export default function CommunityFeed() {
  return (
    <section className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        <SectionHeading eyebrow="Pulso social" title="Últimas Avaliações da Comunidade" tone="secondary">
          <Link href="/busca" className="text-xs font-semibold tracking-[0.24px] text-primary hover:underline">
            Ver todas
          </Link>
        </SectionHeading>

        <div className="space-y-2">
          {DEMO_FEED.map((r) => (
            <article key={r.name} className="flex gap-4 rounded-xl bg-surface p-4">
              <div className="hidden aspect-[2/3] h-[120px] shrink-0 rounded bg-surface-low sm:block" />
              <div className="min-w-0 flex-1 space-y-1">
                <header className="flex flex-wrap items-center justify-between gap-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`flex size-7 items-center justify-center rounded-full text-[11px] font-bold tracking-label ${r.avatar}`}>
                      {r.initials}
                    </span>
                    <span className="text-xs font-bold tracking-[0.24px]">{r.name}</span>
                    <span className={`rounded-full bg-surface-highest px-2 py-0.5 text-[11px] font-bold tracking-label ${r.tagTone}`}>
                      {r.tag}
                    </span>
                  </div>
                  <span className="text-xs text-ink-dim">{r.when}</span>
                </header>
                <p className="flex items-center gap-2">
                  <span className="text-lg font-semibold tracking-[-0.9px]">{r.title}</span>
                  <span className="flex items-center gap-0.5 text-xs font-bold tracking-[0.24px] text-tertiary">
                    <Star aria-hidden className="size-3 fill-current" />
                    {r.score}
                  </span>
                </p>
                <p className="text-sm leading-[22.75px] text-ink-muted">{r.text}</p>
                <footer className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-bold tracking-label text-ink-dim">
                  <span className="flex items-center gap-1">
                    <Heart aria-hidden className="size-3" />
                    {r.likes} curtidas
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare aria-hidden className="size-3" />
                    {r.comments} comentários
                  </span>
                  <span className="text-ink-dim/70">{r.note}</span>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <div className="space-y-4 rounded-xl bg-surface p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-[-0.9px]">Curadores Top da Semana</h3>
            <BadgeCheck aria-hidden className="size-5 text-secondary" />
          </div>
          <ul className="space-y-2">
            {DEMO_CURATORS.map((c) => (
              <li key={c.name} className="flex items-center justify-between rounded-lg bg-surface-low p-2">
                <div className="flex items-center">
                  <span className={`w-4 text-[11px] font-bold tracking-label ${c.rankTone}`}>{c.rank}</span>
                  <span className={`ml-2 flex size-8 items-center justify-center rounded-full text-xs font-bold ${c.avatar}`}>
                    {c.initials}
                  </span>
                  <div className="pl-2">
                    <p className="text-xs font-semibold tracking-[0.24px]">{c.name}</p>
                    <p className="text-xs text-ink-dim">{c.info}</p>
                  </div>
                </div>
                <button className="rounded bg-surface px-2.5 py-1 text-[11px] font-bold tracking-label hover:bg-surface-high">
                  Seguir
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-xl bg-surface p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-[-0.9px]">Listas em Destaque</h3>
            <LibraryBig aria-hidden className="size-5 text-primary" />
          </div>
          <ul className="space-y-2">
            {DEMO_LISTS.map((l) => (
              <li key={l.title}>
                <Link href="/listas" className="block space-y-1 rounded-lg bg-surface-low p-2 hover:bg-surface-high">
                  <p className="text-xs font-bold tracking-[0.24px]">{l.title}</p>
                  <p className="flex items-center justify-between text-[11px] font-bold tracking-label">
                    <span className="text-ink-dim">{l.by}</span>
                    <span className={l.tone}>{l.likes}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/listas"
            className="block rounded bg-surface-high py-2 text-center text-xs font-semibold tracking-[0.24px] hover:bg-surface-highest"
          >
            Explorar Mais Listas
          </Link>
        </div>

        <div className="space-y-2 rounded-xl bg-[linear-gradient(150deg,rgba(160,120,255,0.2)_0%,#1d2026_50%)] p-6">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-label text-primary">
            <UsersRound aria-hidden className="size-4" />
            Mesa própria
          </p>
          <h4 className="text-lg font-extrabold leading-[26px] tracking-[-0.9px]">
            Mestre de RPG? Catalogue sua campanha no RATEMEDIA
          </h4>
          <p className="text-xs leading-[18px] text-ink-muted">
            Crie logs de sessão, vincule fichas dos jogadores, receba avaliações da sua mesa e
            compartilhe seu universo com a comunidade.
          </p>
          <Link
            href="/campanhas/nova"
            className="mt-2 inline-block rounded bg-primary px-4 py-1 text-xs font-bold tracking-[0.24px] text-primary-on hover:bg-primary-strong"
          >
            Criar Ficha de Campanha
          </Link>
        </div>
      </aside>
    </section>
  );
}
