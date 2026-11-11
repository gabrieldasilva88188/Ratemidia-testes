import { describe, expect, it } from "vitest";
import { DEMO_POPULAR, DEMO_TRENDING } from "@/lib/demo-data";
import { buildQuery, filterItems, pageWindow, paginate, sortItems, type SearchItem, type SortKey } from "@/lib/search";

// Integração: catálogo de demonstração + filtro + ordenação + paginação, na mesma
// sequência usada pela página /busca quando o Supabase não está configurado.
const catalog: SearchItem[] = [...DEMO_TRENDING, ...DEMO_POPULAR].map((p) => ({
  key: `d-${p.title}`,
  href: null,
  kind: p.category,
  title: p.title,
  cover: p.cover ?? null,
  year: p.year ?? null,
  subtitle: p.subtitle ?? "",
  genres: [],
  rating: p.rating,
  votes: 0,
  createdAt: "",
}));

function search(opts: { q?: string; tipo?: string; min?: number; sort?: SortKey; page?: number } = {}) {
  const { q = "", tipo = "", min = 0, sort = "rating", page = 1 } = opts;
  const base = catalog.filter((d) => (!q || d.title.toLowerCase().includes(q.toLowerCase())) && (!tipo || d.kind === tipo));
  const filtered = sortItems(filterItems(base, { min, max: 5, genres: [] }), sort);
  return { total: filtered.length, ...paginate(filtered, page) };
}

describe("pipeline da busca (modo demonstração)", () => {
  it("sem filtros traz todo o catálogo em 2 páginas de 12", () => {
    const r = search();
    expect(r.total).toBe(14);
    expect(r.items).toHaveLength(12);
    expect(r.pages).toBe(2);
    expect(search({ page: 2 }).items).toHaveLength(2);
  });

  it("ordena por nota: a obra 5.0 vem primeiro e empates seguem ordem alfabética", () => {
    const titles = search({ min: 4.9 }).items.map((i) => i.title);
    expect(titles[0]).toBe("Vagabond");
    expect(titles.slice(1)).toEqual([...titles.slice(1)].sort((a, b) => a.localeCompare(b)));
    expect(titles).toHaveLength(7);
  });

  it("filtra por tipo e por termo (sem diferenciar maiúsculas)", () => {
    expect(search({ tipo: "anime" }).total).toBe(6);
    expect(search({ tipo: "movie" }).items.map((i) => i.title).sort()).toEqual(["Duna: Parte 2", "Oppenheimer"]);
    expect(search({ q: "FRIEREN" }).items.map((i) => i.title)).toEqual(["Sousou no Frieren"]);
    expect(search({ q: "termo-que-nao-existe" })).toMatchObject({ total: 0, items: [], page: 1, pages: 1 });
  });

  it("combina tipo + nota mínima + ordem A-Z", () => {
    const r = search({ tipo: "anime", min: 4.8, sort: "az" });
    expect(r.items.map((i) => i.title)).toEqual([
      "Bleach: TYBW",
      "Chainsaw Man",
      "Dandadan",
      "Jujutsu Kaisen: Shibuya",
      "Sousou no Frieren",
    ]);
  });

  it("página fora do intervalo cai na última página válida", () => {
    expect(search({ page: 99 })).toMatchObject({ page: 2, pages: 2 });
  });

  it("links de paginação preservam os filtros ativos", () => {
    const view = search({ tipo: "anime" });
    const href = (pagina: number) => `/busca${buildQuery({ tipo: "anime", ordem: "az", min: "", pagina: String(pagina) })}`;
    expect(pageWindow(view.page, view.pages)).toEqual([1]);
    expect(href(2)).toBe("/busca?tipo=anime&ordem=az&pagina=2");
  });
});
