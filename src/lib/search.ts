import type { MediaType } from "@/types";

export type SortKey = "rating" | "popular" | "recent" | "az";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "rating", label: "Mais bem avaliados" },
  { key: "popular", label: "Mais populares" },
  { key: "recent", label: "Recentes" },
  { key: "az", label: "A-Z" },
];

export const PAGE_SIZE = 12;

/** Resultado unificado da busca (obras + campanhas de RPG). */
export interface SearchItem {
  key: string;
  href: string | null; // null => item de demonstração, sem página
  kind: MediaType | "rpg";
  title: string;
  cover: string | null;
  year: number | string | null;
  subtitle: string;
  genres: string[];
  rating: number | null;
  votes: number;
  createdAt: string;
}

export interface Filters {
  min: number;
  max: number;
  genres: string[];
}

export function filterItems(items: SearchItem[], f: Filters): SearchItem[] {
  const byRating = f.min > 0 || f.max < 5;
  return items.filter((i) => {
    if (byRating && (i.rating === null || i.rating < f.min || i.rating > f.max)) return false;
    if (f.genres.length > 0 && !f.genres.some((g) => i.genres.includes(g))) return false;
    return true;
  });
}

export function sortItems(items: SearchItem[], sort: SortKey): SearchItem[] {
  const copy = [...items];
  switch (sort) {
    case "popular":
      return copy.sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));
    case "recent":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "az":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    default:
      return copy.sort(
        (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title),
      );
  }
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((current - 1) * size, current * size), page: current, pages };
}

/** Monta uma query string ignorando valores vazios; arrays viram chaves repetidas. */
export function buildQuery(params: Record<string, string | string[] | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.filter(Boolean).forEach((x) => usp.append(k, x));
    else if (v) usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

/** Números de página compactos: 1 2 3 … 9 */
export function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}
