import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { PosterCategory, PosterItem } from "@/lib/demo-data";

const CATEGORY: Record<PosterCategory, { label: string; tone: string; gradient: string }> = {
  anime: { label: "Anime", tone: "text-primary", gradient: "from-[#3a2a6b] via-[#1d2026] to-[#0b0e14]" },
  series: { label: "Série", tone: "text-secondary", gradient: "from-[#0f4361] via-[#1d2026] to-[#0b0e14]" },
  movie: { label: "Filme", tone: "text-tertiary", gradient: "from-[#6b4310] via-[#1d2026] to-[#0b0e14]" },
  manga: { label: "Mangá", tone: "text-danger", gradient: "from-[#5a1a1a] via-[#1d2026] to-[#0b0e14]" },
  rpg: { label: "RPG", tone: "text-tertiary", gradient: "from-[#4a2a62] via-[#1d2026] to-[#0b0e14]" },
};

export default function Poster({
  item,
  variant = "lg",
}: {
  item: PosterItem;
  variant?: "lg" | "sm";
}) {
  const cat = CATEGORY[item.category];
  const large = variant === "lg";

  const card = (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface transition-transform hover:-translate-y-0.5">
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-high">
        {item.cover ? (
          <Image src={item.cover} alt="" fill sizes="200px" className="object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${cat.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-90" />

        <span
          className={`absolute left-2 top-2 rounded bg-bg/80 px-2 py-0.5 text-[11px] font-bold tracking-label backdrop-blur-md ${cat.tone} ${large ? "uppercase" : ""}`}
        >
          {cat.label}
        </span>

        {large ? (
          item.rating !== null && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-bg/85 px-1.5 py-0.5 text-[11px] font-bold tracking-label text-tertiary backdrop-blur-md">
              <Star aria-hidden className="size-2.5 fill-current" />
              {item.rating.toFixed(1)}
            </span>
          )
        ) : (
          <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between text-[11px] tracking-label">
            <span className="font-bold text-tertiary">
              {item.rating !== null ? `★ ${item.rating.toFixed(1)}` : "—"}
            </span>
            <span className="text-ink-muted">{item.year ?? ""}</span>
          </div>
        )}
      </div>

      {large ? (
        <div className="space-y-0.5 p-2">
          <h3 className="line-clamp-1 text-lg font-bold tracking-[-0.9px]">{item.title}</h3>
          <div className="flex items-start justify-between gap-2 text-[11px] font-bold tracking-label">
            <span className="text-ink-dim">
              {[item.year, item.subtitle].filter(Boolean).join(" • ")}
            </span>
            {item.rank && <span className="shrink-0 text-secondary">{item.rank}</span>}
          </div>
        </div>
      ) : (
        <div className="p-2">
          <h4 className="line-clamp-2 text-xs font-bold tracking-[0.24px]">{item.title}</h4>
          <p className="truncate text-xs text-ink-dim">{item.subtitle}</p>
        </div>
      )}
    </article>
  );

  return item.id ? (
    <Link href={`/obras/${item.id}`} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}
