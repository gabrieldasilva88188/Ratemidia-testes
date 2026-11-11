import type { MediaType } from "@/types";
import { getAnilist, searchAnilist } from "./anilist";
import { getJikan, searchJikan } from "./jikan";
import { getTmdb, isTmdbConfigured, searchTmdb } from "./tmdb";
import { ExternalApiError, SOURCES_BY_TYPE, type ExternalMedia, type ExternalSource } from "./types";

export * from "./types";
export { isTmdbConfigured };

const isAnimeManga = (t: MediaType): t is "anime" | "manga" => t === "anime" || t === "manga";

/**
 * Busca por tipo. Anime/mangá usam o AniList e, se ele falhar, o Jikan
 * (a disponibilidade de cada um varia conforme a rede). Filme/série usam o TMDB.
 */
export async function searchExternal(type: MediaType, query: string, limit = 12): Promise<ExternalMedia[]> {
  if (!isAnimeManga(type)) return searchTmdb(type, query, limit);
  try {
    return await searchAnilist(type, query, limit);
  } catch (e) {
    if (!(e instanceof ExternalApiError)) throw e;
    return searchJikan(type, query, limit);
  }
}

const ALL_TYPES: MediaType[] = ["anime", "manga", "series", "movie"];

/** Busca em todos os tipos de uma vez; um tipo que falhar não derruba os demais. */
export async function searchAllExternal(
  query: string,
  perType = 6,
): Promise<{ results: ExternalMedia[]; failed: MediaType[] }> {
  const settled = await Promise.allSettled(ALL_TYPES.map((t) => searchExternal(t, query, perType)));
  const results: ExternalMedia[] = [];
  const failed: MediaType[] = [];
  settled.forEach((r, i) => (r.status === "fulfilled" ? results.push(...r.value) : failed.push(ALL_TYPES[i])));
  return { results, failed };
}

/** Dados completos de uma obra pelo id externo e fonte (usado na importação, sem confiar no cliente). */
export function fetchExternal(type: MediaType, id: string, source: ExternalSource): Promise<ExternalMedia | null> {
  if (!SOURCES_BY_TYPE[type].includes(source)) return Promise.resolve(null);
  if (source === "tmdb") return getTmdb(type as "movie" | "series", id);
  return source === "anilist" ? getAnilist(type as "anime" | "manga", id) : getJikan(type as "anime" | "manga", id);
}
