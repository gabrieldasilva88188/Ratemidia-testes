import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { campaignRatings, mediaRatings } from "@/lib/data";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import {
  DEMO_POPULAR,
  DEMO_RPG,
  DEMO_TRENDING,
  type DemoRpg,
  type PosterCategory,
  type PosterItem,
} from "@/lib/demo-data";
import type { Campaign, Media } from "@/types";
import Hero, { DEMO_SPOTLIGHT, type SpotlightData } from "@/components/home/Hero";
import StatsStrip, { type Stats } from "@/components/home/StatsStrip";
import Poster from "@/components/home/Poster";
import SectionHeading from "@/components/home/SectionHeading";
import RpgFeatured from "@/components/home/RpgFeatured";
import CommunityFeed from "@/components/home/CommunityFeed";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "anime", label: "Animes" },
  { key: "manga", label: "Mangás" },
  { key: "series", label: "Séries" },
  { key: "movie", label: "Filmes" },
  { key: "rpg", label: "Mesas RPG" },
];

const fmt = (n: number) => n.toLocaleString("pt-BR");

function toPoster(m: Media, rating: number | null): PosterItem {
  return {
    id: m.id,
    title: m.title,
    category: m.type as PosterCategory,
    rating,
    year: m.release_year,
    subtitle: m.total_units ? `${m.total_units} un.` : undefined,
    cover: m.cover_url,
  };
}

const RPG_BADGES = [
  "bg-primary-strong/80 text-primary-on",
  "bg-secondary-strong/80 text-secondary-on",
  "bg-danger-container/80 text-danger-on",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = "" } = await searchParams;

  let trending: PosterItem[] = DEMO_TRENDING;
  let popular: PosterItem[] = DEMO_POPULAR;
  let rpg: DemoRpg[] = DEMO_RPG;
  let spotlight: SpotlightData = DEMO_SPOTLIGHT;
  let rpgTotal = "1.420";
  let stats: Stats = {
    works: "24.500+",
    reviews: "180.400+",
    campaigns: "1.420+",
    curators: "56.200+",
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [{ data: mediaRows }, { data: campRows }, works, reviews, camps, users] =
      await Promise.all([
        supabase.from("media").select("*").order("created_at", { ascending: false }).limit(24),
        supabase
          .from("campaigns")
          .select("*, profiles(username)")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.from("media").select("id", { count: "exact", head: true }),
        supabase.from("library_entries").select("id", { count: "exact", head: true }).not("review", "is", null),
        supabase.from("campaigns").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

    const media = (mediaRows ?? []) as Media[];
    if (media.length > 0) {
      const ratings = await mediaRatings(media.map((m) => m.id));
      const posters = media.map((m) => toPoster(m, ratings.get(m.id) ?? null));
      trending = posters.slice(0, 6);
      popular = posters;

      const top = media[0];
      spotlight = {
        id: top.id,
        title: top.title,
        year: top.release_year,
        meta: `${top.type.toUpperCase()}${top.total_units ? ` • ${top.total_units} un.` : ""}`,
        tags: [],
        synopsis: top.synopsis ?? "Sem sinopse cadastrada.",
        cover: top.cover_url,
        score: ratings.get(top.id) ?? 0,
        votes: "avaliações da comunidade",
      };
    }

    const campaigns = (campRows ?? []) as (Campaign & { profiles: { username: string } | null })[];
    if (campaigns.length > 0) {
      const cr = await campaignRatings(campaigns.map((c) => c.id));
      rpg = campaigns.map((c, i) => ({
        id: c.id,
        title: c.title,
        synopsis: c.synopsis,
        badge: c.system,
        badgeClass: RPG_BADGES[i % RPG_BADGES.length],
        system: "RPG",
        rating: cr.get(c.id) ?? 0,
        phase: CAMPAIGN_STATUSES[c.status],
        cadence: CAMPAIGN_STATUSES[c.status],
        dm: c.profiles?.username ?? "—",
        players: "—",
        sessions: "—",
        avatars: [{ letter: (c.profiles?.username ?? "M").slice(0, 1).toUpperCase(), className: "bg-primary-strong text-primary-on" }],
        extra: 0,
      }));
    }

    stats = {
      works: fmt(works.count ?? 0),
      reviews: fmt(reviews.count ?? 0),
      campaigns: fmt(camps.count ?? 0),
      curators: fmt(users.count ?? 0),
    };
    rpgTotal = fmt(camps.count ?? 0);
  }

  const filtered = (cat ? popular.filter((p) => p.category === cat) : popular).slice(0, 8);

  return (
    <>
      <Hero data={spotlight} />
      <StatsStrip stats={stats} />

      <div className="mx-auto max-w-[1280px] space-y-10 px-6 py-10 xl:px-12">
        <section className="space-y-4">
          <SectionHeading eyebrow="Tendências de audiência" title="Em Alta Esta Semana">
            <div className="flex items-center gap-2 text-xs text-ink-dim">
              Atualizado a cada 15 min
              <span className="flex gap-1">
                <span className="rounded bg-surface p-1.5"><ChevronLeft aria-hidden className="size-3" /></span>
                <span className="rounded bg-surface p-1.5"><ChevronRight aria-hidden className="size-3" /></span>
              </span>
            </div>
          </SectionHeading>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {trending.map((p) => (
              <Poster key={p.title} item={p} />
            ))}
          </div>
        </section>

        <RpgFeatured items={rpg} total={rpgTotal} />

        <section className="space-y-4">
          <SectionHeading eyebrow="Exploração dinâmica" title="Populares por Categoria" tone="secondary">
            <nav aria-label="Filtrar por categoria" className="flex gap-1.5 overflow-x-auto rounded-xl bg-surface p-1">
              {TABS.map((t) => (
                <Link
                  key={t.label}
                  href={t.key ? `/?cat=${t.key}` : "/"}
                  scroll={false}
                  className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold tracking-[0.24px] ${
                    cat === t.key ? "bg-surface-highest text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </SectionHeading>
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-dim">Nada nesta categoria ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-8">
              {filtered.map((p) => (
                <Poster key={p.title} item={p} variant="sm" />
              ))}
            </div>
          )}
        </section>

        <CommunityFeed />
      </div>
    </>
  );
}
