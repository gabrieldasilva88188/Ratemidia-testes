import { translateGenre } from "./genres";
import { fetchJson } from "./http";
import type { ExternalMedia } from "./types";

// AniList GraphQL: gratuito e sem chave para leitura. https://docs.anilist.co/
const ENDPOINT = "https://graphql.anilist.co";

export type AnilistKind = "anime" | "manga";

interface AnilistItem {
  id: number;
  title: { romaji?: string | null; english?: string | null };
  description?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null };
  startDate?: { year?: number | null };
  episodes?: number | null;
  chapters?: number | null;
  genres?: string[];
  studios?: { nodes?: { name: string }[] };
  staff?: { edges?: { role?: string | null; node: { name: { full: string } } }[] };
}

const FIELDS = `
  id
  title { romaji english }
  description(asHtml: false)
  coverImage { extraLarge large }
  startDate { year }
  episodes
  chapters
  genres
  studios(isMain: true) { nodes { name } }
  staff(perPage: 4, sort: RELEVANCE) { edges { role node { name { full } } } }
`;

const SEARCH = `query ($search: String, $type: MediaType, $perPage: Int) {
  Page(perPage: $perPage) {
    media(search: $search, type: $type, isAdult: false, format_not_in: [NOVEL], sort: SEARCH_MATCH) { ${FIELDS} }
  }
}`;

const BY_ID = `query ($id: Int, $type: MediaType) {
  Media(id: $id, type: $type, isAdult: false) { ${FIELDS} }
}`;

const gqlType = (kind: AnilistKind) => (kind === "anime" ? "ANIME" : "MANGA");

/** A descrição do AniList vem com <br>, <i> etc. mesmo sem HTML ligado. */
export function cleanDescription(raw?: string | null): string | null {
  if (!raw) return null;
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

export function mapAnilist(kind: AnilistKind, i: AnilistItem): ExternalMedia {
  const people =
    kind === "anime"
      ? (i.studios?.nodes ?? []).map((s) => s.name)
      : (i.staff?.edges ?? []).filter((e) => /story|art/i.test(e.role ?? "")).map((e) => e.node.name.full);

  return {
    source: "anilist",
    external_id: String(i.id),
    type: kind,
    title: i.title.english || i.title.romaji || "Sem título",
    subtitle: people.length ? [...new Set(people)].slice(0, 2).join(", ").slice(0, 120) : null,
    synopsis: cleanDescription(i.description),
    cover_url: i.coverImage?.extraLarge ?? i.coverImage?.large ?? null,
    release_year: i.startDate?.year ?? null,
    total_units: i.episodes ?? i.chapters ?? null,
    genres: [...new Set((i.genres ?? []).map(translateGenre))].slice(0, 8),
  };
}

export async function searchAnilist(kind: AnilistKind, query: string, limit = 12): Promise<ExternalMedia[]> {
  const search = query.trim();
  if (!search) return [];
  const json = await fetchJson<{ data: { Page: { media: AnilistItem[] } } }>(ENDPOINT, {
    body: { query: SEARCH, variables: { search, type: gqlType(kind), perPage: limit } },
  });
  return json.data.Page.media.map((m) => mapAnilist(kind, m));
}

export async function getAnilist(kind: AnilistKind, id: string): Promise<ExternalMedia | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const json = await fetchJson<{ data: { Media: AnilistItem | null } }>(ENDPOINT, {
      body: { query: BY_ID, variables: { id: Number(id), type: gqlType(kind) } },
      revalidate: 86400,
    });
    return json.data.Media ? mapAnilist(kind, json.data.Media) : null;
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null; // AniList responde 404 quando o id não existe
    throw e;
  }
}
