import Link from "next/link";
import { ArrowRight, Dices, ExternalLink } from "lucide-react";
import type { DemoRpg } from "@/lib/demo-data";
import SectionHeading from "./SectionHeading";

export default function RpgFeatured({ items, total }: { items: DemoRpg[]; total: string }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        eyebrow="Mesas & Campanhas Coletivas"
        title="Campanhas de RPG em Destaque da Comunidade"
        tone="tertiary"
      >
        <Link
          href="/campanhas"
          className="flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-tertiary hover:underline"
        >
          Explorar todas as {total} campanhas
          <ArrowRight aria-hidden className="size-3" />
        </Link>
      </SectionHeading>

      <div className="grid gap-5 md:grid-cols-3">
        {items.map((c) => (
          <article key={c.title} className="flex flex-col overflow-hidden rounded-xl bg-surface">
            <div className="relative flex h-44 flex-col justify-end bg-surface-high p-3">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(160,120,255,0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
              <span
                className={`absolute left-3 top-[15px] rounded-full px-2.5 py-[3.5px] text-[11px] font-bold uppercase tracking-[0.275px] backdrop-blur-md ${c.badgeClass}`}
              >
                {c.badge}
              </span>
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded bg-bg/80 px-2 py-0.5 text-[11px] font-bold tracking-label text-tertiary backdrop-blur-md">
                <Dices aria-hidden className="size-[9px]" />
                {c.system} • {c.rating.toFixed(1)}
              </span>
              <div className="relative flex items-center justify-between text-[11px] tracking-label">
                <span className="font-semibold text-secondary">{c.phase}</span>
                <span className="flex items-center gap-1 font-bold text-ink-muted">
                  <span className="size-2 rounded-full bg-secondary shadow-[0_0_6px_#7bd0ff]" />
                  {c.cadence}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="text-lg font-bold tracking-[-0.9px]">{c.title}</h3>
              <p className="line-clamp-2 text-xs leading-[19.5px] text-ink-muted">{c.synopsis}</p>

              <dl className="grid grid-cols-3 gap-2 rounded-lg bg-surface-low px-3 pb-2 pt-1 text-center text-[11px] tracking-label">
                <div>
                  <dt className="font-bold text-ink-dim">Mestre (DM)</dt>
                  <dd className="truncate font-semibold">{c.dm}</dd>
                </div>
                <div>
                  <dt className="font-bold text-ink-dim">Jogadores</dt>
                  <dd className="font-semibold">{c.players}</dd>
                </div>
                <div>
                  <dt className="font-bold text-ink-dim">Sessões</dt>
                  <dd className="font-semibold">{c.sessions}</dd>
                </div>
              </dl>

              <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex">
                  {c.avatars.map((a) => (
                    <span
                      key={a.letter}
                      className={`-mr-2 flex size-7 items-center justify-center rounded-full text-xs font-bold ring-2 ring-surface ${a.className}`}
                    >
                      {a.letter}
                    </span>
                  ))}
                  <span className="flex size-7 items-center justify-center rounded-full bg-surface-bright text-xs font-bold ring-2 ring-surface">
                    +{c.extra}
                  </span>
                </div>
                <Link
                  href={c.id ? `/campanhas/${c.id}` : "/campanhas"}
                  className="flex items-center gap-1 rounded bg-surface-high px-4 py-1.5 text-[11px] font-semibold tracking-label hover:bg-surface-highest"
                >
                  Ver Campanha
                  <ExternalLink aria-hidden className="size-[10px]" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
