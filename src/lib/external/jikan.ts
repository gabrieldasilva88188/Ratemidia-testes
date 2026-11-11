import { translateGenre } from "./genres";
import { fetchJson } from "./http";
import type { ExternalMedia } from "./types";

// Jikan v4 (MyAnimeList não-oficial): não exige conta nem chave.
// https://docs.api.jikan.moe/
const BASE = "https://api.jikan.moe/v4";

export type JikanKind = "anime" | "manga";

interface JikanNamed {
  name: string;
}

interface JikanItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  synopsis: string | null;
  year?: number | null;
  aired?: { prop?: { from?: { year?: number | null } } };
  published?: { prop?: { from?: { year?: number | null } } };
  episodes?: number | null;
  chapters?: number | null;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
  studios?: JikanNamed[];
  authors?: JikanNamed[];
  genres?: JikanNamed[];
  themes?: JikanNamed[];
  demographics?: JikanNamed[];
}


export function mapJikan(kind: JikanKind, i: JikanItem): ExternalMedia {
  const img = i.images?.webp?.large_image_url ?? i.images?.jpg?.large_image_url ?? i.images?.jpg?.image_url;
  const people = kind === "anime" ? i.studios : i.authors;
  const names = [...(i.genres ?? []), ...(i.demographics ?? []), ...(i.themes ?? [])].map((g) => translateGenre(g.name));

  return {
    source: "jikan",
    external_id: String(i.mal_id),
    type: kind,
    title: i.title_english || i.title,
    subtitle: people?.length ? people.slice(0, 2).map((p) => p.name).join(", ").slice(0, 120) : null,
    synopsis: i.synopsis?.trim() || null,
    cover_url: img ?? null,
    release_year: i.year ?? i.aired?.prop?.from?.year ?? i.published?.prop?.from?.year ?? null,
    total_units: i.episodes ?? i.chapters ?? null,
    genres: [...new Set(names)].slice(0, 8),
  };
}

export async function searchJikan(kind: JikanKind, query: string, limit = 12): Promise<ExternalMedia[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({ q, limit: String(limit), sfw: "true", order_by: "popularity", sort: "asc" });
  const json = await fetchJson<{ data: JikanItem[] }>(`${BASE}/${kind}?${params}`);
  return json.data.map((i) => mapJikan(kind, i));
}

export async function getJikan(kind: JikanKind, id: string): Promise<ExternalMedia | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const json = await fetchJson<{ data: JikanItem }>(`${BASE}/${kind}/${id}/full`, { revalidate: 86400 });
    return mapJikan(kind, json.data);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}
