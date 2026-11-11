import type { CampaignStatus, MediaType, PublishStatus, UserStatus } from "@/types";

export const MEDIA_TYPES: Record<MediaType, string> = {
  anime: "Anime",
  manga: "Mangá",
  series: "Série",
  movie: "Filme",
};

// Rótulos dinâmicos por categoria (assistir x ler).
export function statusLabel(status: UserStatus, type: MediaType): string {
  const reading = type === "manga";
  const labels: Record<UserStatus, string> = {
    planned: reading ? "Quero Ler" : "Quero Assistir",
    in_progress: reading ? "Lendo" : "Assistindo",
    completed: reading ? "Lido" : "Assistido",
    dropped: "Abandonado",
  };
  return labels[status];
}

export const USER_STATUSES: UserStatus[] = ["planned", "in_progress", "completed", "dropped"];

export const CAMPAIGN_STATUSES: Record<CampaignStatus, string> = {
  recruiting: "Recrutando",
  ongoing: "Em andamento",
  finished: "Encerrada",
  paused: "Pausada",
};

export const PUBLISH_STATUSES: Record<PublishStatus, string> = {
  published: "Publicado",
  draft: "Rascunho",
  review: "Em Revisão",
};

// Gêneros oferecidos como filtro na busca e como sugestão no cadastro de obras.
export const GENRES = [
  "Fantasia Sombria",
  "Ação",
  "Aventura",
  "Cyberpunk",
  "Drama",
  "Ficção Científica",
  "Isekai",
  "Mistério",
  "Romance",
  "Shonen",
  "Seinen",
  "Terror Cósmico",
] as const;

// Cores semânticas por tipo de mídia (badges), alinhadas ao DESIGN.md.
export const TYPE_TONE: Record<MediaType | "rpg", string> = {
  anime: "border-pink-400/30 bg-pink-400/15 text-pink-300",
  manga: "border-orange-400/30 bg-orange-400/15 text-orange-300",
  movie: "border-secondary/30 bg-secondary/15 text-secondary",
  series: "border-primary/30 bg-primary/15 text-primary",
  rpg: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
};

export const STATUS_DOT: Record<UserStatus, string> = {
  planned: "bg-primary",
  in_progress: "bg-secondary shadow-[0_0_8px_rgba(123,208,255,0.6)]",
  completed: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
  dropped: "bg-rose-400",
};
