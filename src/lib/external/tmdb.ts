import { fetchJson } from "./http";
import { ExternalApiError, type ExternalMedia } from "./types";

// TMDB exige conta gratuita: https://www.themoviedb.org/settings/api
// Aceita TMDB_API_READ_TOKEN (Bearer, "Token de Acesso de Leitura da API", recomendado)
// ou TMDB_API_KEY (chave v3 "API Key").
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

export type TmdbKind = "movie" | "series";

export const isTmdbConfigured = () => Boolean(process.env.TMDB_API_READ_TOKEN || process.env.TMDB_API_KEY);

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_episodes?: number;
  created_by?: { name: string }[];
  networks?: { name: string }[];
  production_companies?: { name: string }[];
}

const endpoint = (kind: TmdbKind) => (kind === "movie" ? "movie" : "tv");

function auth(): { headers: Record<string, string>; query: string } {
  const token = process.env.TMDB_API_READ_TOKEN;
  if (token) return { headers: { Authorization: `Bearer ${token}` }, query: "" };
  const key = process.env.TMDB_API_KEY;
  if (key) return { headers: {}, query: `&api_key=${encodeURIComponent(key)}` };
  throw new ExternalApiError("TMDB não configurado: defina TMDB_API_READ_TOKEN ou TMDB_API_KEY.");
}

async function tmdb<T>(path: string, params: Record<string, string>, revalidate?: number): Promise<T> {
  const { headers, query } = auth();
  const qs = new URLSearchParams({ language: "pt-BR", ...params });
  return fetchJson<T>(`${BASE}${path}?${qs}${query}`, { headers, revalidate });
}

async function genreMap(kind: TmdbKind): Promise<Map<number, string>> {
  const json = await tmdb<{ genres: { id: number; name: string }[] }>(`/genre/${endpoint(kind)}/list`, {}, 86400);
  return new Map(json.genres.map((g) => [g.id, g.name]));
}

export function mapTmdb(kind: TmdbKind, i: TmdbItem, genres: Map<number, string>): ExternalMedia {
  const date = i.release_date || i.first_air_date || "";
  const year = Number(date.slice(0, 4));
  const credits =
    kind === "series"
      ? (i.networks?.map((n) => n.name) ?? [])
      : (i.production_companies?.map((c) => c.name) ?? []);
  const genreNames = i.genres?.map((g) => g.name) ?? (i.genre_ids ?? []).map((id) => genres.get(id)).filter((g): g is string => !!g);

  return {
    source: "tmdb",
    external_id: String(i.id),
    type: kind,
    title: i.title ?? i.name ?? "Sem título",
    subtitle: credits.length ? credits.slice(0, 2).join(", ").slice(0, 120) : null,
    synopsis: i.overview?.trim() || null,
    cover_url: i.poster_path ? `${IMG}${i.poster_path}` : null,
    release_year: Number.isFinite(year) && year > 0 ? year : null,
    total_units: kind === "movie" ? 1 : (i.number_of_episodes ?? null),
    genres: genreNames.slice(0, 8),
  };
}

export async function searchTmdb(kind: TmdbKind, query: string, limit = 12): Promise<ExternalMedia[]> {
  const q = query.trim();
  if (!q || !isTmdbConfigured()) return [];
  const [json, genres] = await Promise.all([
    tmdb<{ results: TmdbItem[] }>(`/search/${endpoint(kind)}`, { query: q, include_adult: "false" }),
    genreMap(kind),
  ]);
  return json.results.slice(0, limit).map((i) => mapTmdb(kind, i, genres));
}

export async function getTmdb(kind: TmdbKind, id: string): Promise<ExternalMedia | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const item = await tmdb<TmdbItem>(`/${endpoint(kind)}/${id}`, {}, 86400);
    return mapTmdb(kind, item, new Map());
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}
