import { describe, expect, it } from "vitest";
import { monthYear, timeAgo } from "@/lib/format";

const NOW = new Date("2026-11-05T12:00:00Z").getTime();
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("timeAgo", () => {
  it.each([
    [30, "agora há pouco"],
    [60, "há 1 minuto"],
    [5 * 60, "há 5 minutos"],
    [3 * 3600, "há 3 horas"],
    [24 * 3600, "ontem"],
    [14 * 24 * 3600, "há 2 semanas"],
    [60 * 24 * 3600, "há 2 meses"],
    [400 * 24 * 3600, "ano passado"],
    [3 * 365 * 24 * 3600, "há 3 anos"],
  ])("%i segundos atrás => %s", (seconds, expected) => {
    expect(timeAgo(ago(seconds), NOW)).toBe(expected);
  });

  it("formata datas futuras", () => {
    expect(timeAgo(ago(-5 * 24 * 3600), NOW)).toBe("em 5 dias");
    expect(timeAgo(ago(-24 * 3600), NOW)).toBe("amanhã");
  });

  it("usa Date.now() quando a referência não é informada", () => {
    expect(timeAgo(new Date().toISOString())).toBe("agora há pouco");
  });
});

describe("monthYear", () => {
  it("mostra mês por extenso e ano em pt-BR", () => {
    expect(monthYear("2026-11-15T12:00:00Z")).toBe("novembro de 2026");
    expect(monthYear("2024-03-10T12:00:00Z")).toBe("março de 2024");
  });
});
