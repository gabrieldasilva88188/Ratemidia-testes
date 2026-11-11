import { describe, expect, it } from "vitest";
import { buildQuery, filterItems, pageWindow, paginate, sortItems, type SearchItem } from "./search";

const item = (over: Partial<SearchItem>): SearchItem => ({
  key: over.title ?? "x",
  href: null,
  kind: "anime",
  title: "T",
  cover: null,
  year: 2024,
  subtitle: "",
  genres: [],
  rating: null,
  votes: 0,
  createdAt: "2024-01-01",
  ...over,
});

describe("search helpers", () => {
  const items = [
    item({ title: "B", rating: 4.5, votes: 2, genres: ["Isekai"], createdAt: "2024-03-01" }),
    item({ title: "A", rating: 3, votes: 9, genres: ["Drama"], createdAt: "2024-05-01" }),
    item({ title: "C", rating: null, votes: 0 }),
  ];

  it("filtra por nota mínima excluindo obras sem nota", () => {
    expect(filterItems(items, { min: 4, max: 5, genres: [] }).map((i) => i.title)).toEqual(["B"]);
    expect(filterItems(items, { min: 0, max: 5, genres: [] })).toHaveLength(3);
  });

  it("filtra por gênero", () => {
    expect(filterItems(items, { min: 0, max: 5, genres: ["Drama"] }).map((i) => i.title)).toEqual(["A"]);
  });

  it("ordena por nota, popularidade, recência e A-Z", () => {
    expect(sortItems(items, "rating").map((i) => i.title)).toEqual(["B", "A", "C"]);
    expect(sortItems(items, "popular")[0].title).toBe("A");
    expect(sortItems(items, "recent")[0].title).toBe("A");
    expect(sortItems(items, "az").map((i) => i.title)).toEqual(["A", "B", "C"]);
  });

  it("pagina com limites seguros", () => {
    const p = paginate([1, 2, 3, 4, 5], 99, 2);
    expect(p).toEqual({ items: [5], page: 3, pages: 3 });
    expect(paginate([], 1).pages).toBe(1);
  });

  it("monta query string", () => {
    expect(buildQuery({ q: "a b", genero: ["x", "y"], tipo: "" })).toBe("?q=a+b&genero=x&genero=y");
    expect(buildQuery({})).toBe("");
  });

  it("gera janela de páginas", () => {
    expect(pageWindow(1, 9)).toEqual([1, 2, "…", 9]);
    expect(pageWindow(5, 9)).toEqual([1, "…", 4, 5, 6, "…", 9]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });
});
