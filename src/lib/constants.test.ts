import { describe, expect, it } from "vitest";
import { statusLabel } from "./constants";

describe("statusLabel", () => {
  it("usa 'Ler' para mangás", () => {
    expect(statusLabel("planned", "manga")).toBe("Quero Ler");
    expect(statusLabel("completed", "manga")).toBe("Lido");
  });

  it("usa 'Assistir' para os demais tipos", () => {
    expect(statusLabel("in_progress", "anime")).toBe("Assistindo");
    expect(statusLabel("dropped", "movie")).toBe("Abandonado");
  });
});
