import type { MediaType } from "@/types";

export type ExternalSource = "anilist" | "jikan" | "tmdb";

/** Obra vinda de uma API externa, já normalizada para o modelo do RateMedia. */
export interface ExternalMedia {
  source: ExternalSource;
  external_id: string;
  type: MediaType;
  title: string;
  subtitle: string | null; // estúdio, autor, emissora...
  synopsis: string | null;
  cover_url: string | null;
  release_year: number | null;
  total_units: number | null; // episódios, capítulos ou 1 (filme)
  genres: string[];
}

/** Fontes aceitas por tipo de mídia (a primeira é a principal). */
export const SOURCES_BY_TYPE: Record<MediaType, ExternalSource[]> = {
  anime: ["anilist", "jikan"],
  manga: ["anilist", "jikan"],
  movie: ["tmdb"],
  series: ["tmdb"],
};

export class ExternalApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

/**
 * Chave de unicidade gravada em media.external_id. Os ids do AniList, Jikan e
 * TMDB são numerados por tipo (anime 20 e mangá 20, filme 550 e série 550 são
 * obras diferentes), então o tipo entra na chave para não colidir com a
 * constraint unique (external_source, external_id).
 */
export const storageId = (item: Pick<ExternalMedia, "type" | "external_id">) => `${item.type}:${item.external_id}`;
