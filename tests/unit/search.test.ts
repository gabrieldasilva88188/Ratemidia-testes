import { describe, expect, it } from "vitest";
import { buildQuery, filterItems, pageWindow, paginate, PAGE_SIZE, sortItems, SORTS, type SearchItem } from "@/lib/search";

// Casos de borda das regras de busca (complementa src/lib/search.test.ts).
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

describe("filterItems", () => {
  const items = [
    item({ title: "Alta", rating: 4.8, genres: ["Ação", "Drama"] }),
    item({ title: "Média", rating: 3, genres: ["Romance"] }),
    item({ title: "Baixa", rating: 1.5, genres: ["Ação"] }),
    item({ title: "Sem nota", rating: null, genres: ["Drama"] }),
  ];
  const titles = (list: SearchItem[]) => list.map((i) => i.title);

  it("respeita a nota máxima e os limites inclusivos", () => {
    expect(titles(filterItems(items, { min: 1.5, max: 3, genres: [] }))).toEqual(["Média", "Baixa"]);
  });

  it("vários gêneros funcionam como OU", () => {
    expect(titles(filterItems(items, { min: 0, max: 5, genres: ["Romance", "Drama"] }))).toEqual(["Alta", "Média", "Sem nota"]);
  });

  it("combina gênero e nota", () => {
    expect(titles(filterItems(items, { min: 2, max: 5, genres: ["Ação"] }))).toEqual(["Alta"]);
  });

  it("faixa completa (0–5) mantém obras sem nota", () => {
    expect(filterItems(items, { min: 0, max: 5, genres: [] })).toHaveLength(4);
  });
});

describe("sortItems", () => {
  it("não altera o array original", () => {
    const original = [item({ title: "B", rating: 1 }), item({ title: "A", rating: 5 })];
    const snapshot = original.map((i) => i.title);
    sortItems(original, "rating");
    expect(original.map((i) => i.title)).toEqual(snapshot);
  });

  it("empate de popularidade desempata pelo título", () => {
    const list = [item({ title: "Zeta", votes: 3 }), item({ title: "Alfa", votes: 3 }), item({ title: "Beta", votes: 1 })];
    expect(sortItems(list, "popular").map((i) => i.title)).toEqual(["Alfa", "Zeta", "Beta"]);
  });

  it("A-Z considera acentos do português", () => {
    const list = [item({ title: "Órfão" }), item({ title: "Ozark" }), item({ title: "Ação" }), item({ title: "Avatar" })];
    expect(sortItems(list, "az").map((i) => i.title)).toEqual(["Ação", "Avatar", "Órfão", "Ozark"]);
  });

  it("todas as opções de ordenação exibidas na tela são suportadas", () => {
    expect(SORTS.map((s) => s.key)).toEqual(["rating", "popular", "recent", "az"]);
  });
});

describe("paginate", () => {
  const nums = Array.from({ length: 30 }, (_, i) => i + 1);

  it("usa o tamanho de página padrão", () => {
    expect(paginate(nums, 1).items).toHaveLength(PAGE_SIZE);
    expect(paginate(nums, 1).pages).toBe(Math.ceil(30 / PAGE_SIZE));
  });

  it.each([
    [0, 1],
    [-3, 1],
    [Number.NaN, 1],
    [2.7, 2],
  ])("página %s vira %i", (page, expected) => {
    expect(paginate(nums, page).page).toBe(expected);
  });

  it("última página traz apenas o restante", () => {
    expect(paginate(nums, 3)).toEqual({ items: [25, 26, 27, 28, 29, 30], page: 3, pages: 3 });
  });
});

describe("buildQuery", () => {
  it("ignora arrays vazios e valores vazios dentro do array", () => {
    expect(buildQuery({ genero: [], tipo: "anime" })).toBe("?tipo=anime");
    expect(buildQuery({ genero: ["", "Drama"] })).toBe("?genero=Drama");
  });

  it("codifica caracteres especiais", () => {
    expect(buildQuery({ q: "Ação & Aventura" })).toBe("?q=A%C3%A7%C3%A3o+%26+Aventura");
  });
});

describe("pageWindow", () => {
  it("na última página mostra a anterior", () => {
    expect(pageWindow(9, 9)).toEqual([1, "…", 8, 9]);
  });

  it("até 5 páginas mostra todas", () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("não insere reticências entre páginas vizinhas", () => {
    expect(pageWindow(3, 9)).toEqual([1, 2, 3, 4, "…", 9]);
  });
});
