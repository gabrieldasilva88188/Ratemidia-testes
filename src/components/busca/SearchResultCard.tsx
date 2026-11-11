import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { MEDIA_TYPES, TYPE_TONE } from "@/lib/constants";
import type { SearchItem } from "@/lib/search";

const GRADIENT: Record<SearchItem["kind"], string> = {
  anime: "from-[#3a2a6b]",
  series: "from-[#0f4361]",
  movie: "from-[#6b4310]",
  manga: "from-[#5a1a1a]",
  rpg: "from-[#0f4a3a]",
};

export default function SearchResultCard({ item }: { item: SearchItem }) {
  const label = item.kind === "rpg" ? "RPG" : MEDIA_TYPES[item.kind];
  const meta = [item.year, item.subtitle].filter(Boolean).join(" • ");

  const body = (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-primary-strong/40 hover:shadow-[0_12px_32px_-4px_rgba(139,92,246,0.15)]">
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-high">
        {item.cover ? (
          <Image src={item.cover} alt="" fill sizes="(min-width:1024px) 22vw, 50vw" className="object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${GRADIENT[item.kind]} via-surface to-bg`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />
        <span
          className={`absolute left-2 top-2 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-label backdrop-blur-md ${TYPE_TONE[item.kind]}`}
        >
          {label}
        </span>
        {item.rating !== null && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-bg/85 px-1.5 py-0.5 text-[11px] font-bold text-tertiary backdrop-blur-md">
            <Star aria-hidden className="size-2.5 fill-current" />
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-[11px] font-bold uppercase tracking-label text-ink-dim">{meta || "—"}</p>
        <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-[-0.6px]">{item.title}</h3>
        {item.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {item.genres.slice(0, 2).map((g) => (
              <li key={g} className="rounded bg-surface-high px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                {g}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 text-xs">
          <span className="text-ink-dim">
            {item.votes > 0 ? `${item.votes} ${item.votes === 1 ? "avaliação" : "avaliações"}` : "Sem avaliações"}
          </span>
          {item.href && (
            <span className="flex items-center gap-1 font-bold text-primary group-hover:text-secondary">
              Ver Ficha <ArrowRight aria-hidden className="size-3" />
            </span>
          )}
        </div>
      </div>
    </article>
  );

  return item.href ? (
    <Link href={item.href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
