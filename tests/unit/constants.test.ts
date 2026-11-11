import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_STATUSES,
  GENRES,
  MEDIA_TYPES,
  PUBLISH_STATUSES,
  STATUS_DOT,
  statusLabel,
  TYPE_TONE,
  USER_STATUSES,
} from "@/lib/constants";
import type { MediaType } from "@/types";

const TYPES = Object.keys(MEDIA_TYPES) as MediaType[];

describe("statusLabel", () => {
  it.each([
    ["planned", "Quero Assistir", "Quero Ler"],
    ["in_progress", "Assistindo", "Lendo"],
    ["completed", "Assistido", "Lido"],
    ["dropped", "Abandonado", "Abandonado"],
  ] as const)("%s => '%s' (assistir) / '%s' (ler)", (status, watch, read) => {
    for (const type of ["anime", "series", "movie"] as const) expect(statusLabel(status, type)).toBe(watch);
    expect(statusLabel(status, "manga")).toBe(read);
  });

  it("existe rótulo para todo status x tipo", () => {
    for (const status of USER_STATUSES) for (const type of TYPES) expect(statusLabel(status, type)).toBeTruthy();
  });
});

describe("tabelas de rótulos e estilos", () => {
  it("os quatro tipos de mídia têm nome em português", () => {
    expect(MEDIA_TYPES).toEqual({ anime: "Anime", manga: "Mangá", series: "Série", movie: "Filme" });
  });

  it("todo tipo (inclusive RPG) tem cor de badge", () => {
    for (const kind of [...TYPES, "rpg" as const]) expect(TYPE_TONE[kind]).toMatch(/text-/);
  });

  it("todo status pessoal tem indicador visual", () => {
    for (const status of USER_STATUSES) expect(STATUS_DOT[status]).toMatch(/^bg-/);
  });

  it("status de campanha e de publicação cobrem os enums do banco", () => {
    expect(Object.keys(CAMPAIGN_STATUSES).sort()).toEqual(["finished", "ongoing", "paused", "recruiting"]);
    expect(Object.keys(PUBLISH_STATUSES).sort()).toEqual(["draft", "published", "review"]);
  });

  it("lista de gêneros não tem repetidos", () => {
    expect(new Set(GENRES).size).toBe(GENRES.length);
  });
});
