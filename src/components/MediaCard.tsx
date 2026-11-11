import Image from "next/image";
import { MEDIA_TYPES } from "@/lib/constants";
import type { Media } from "@/types";
import RatingStars from "./RatingStars";

export default function MediaCard({
  media,
  rating = null,
}: {
  media: Pick<Media, "title" | "type" | "cover_url" | "release_year">;
  rating?: number | null;
}) {
  return (
    <article className="overflow-hidden rounded-card border border-line bg-bg-card transition hover:border-brand">
      <div className="relative aspect-[2/3] bg-bg-soft">
        {media.cover_url ? (
          <Image src={media.cover_url} alt={media.title} fill sizes="200px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-muted">Sem capa</div>
        )}
        <span className="absolute left-2 top-2 rounded bg-bg/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-blue">
          {MEDIA_TYPES[media.type]}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{media.title}</h3>
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{media.release_year ?? "—"}</span>
          <RatingStars value={rating} />
        </div>
      </div>
    </article>
  );
}
