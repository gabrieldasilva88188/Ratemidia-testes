import { describe, expect, it, vi } from "vitest";

// data.ts importa o client Supabase; aqui testamos só as funções puras.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { average, canManageCampaign } from "@/lib/data";

describe("average", () => {
  it("calcula a média ignorando valores nulos", () => {
    expect(average([5, null, 4, 3])).toBe(4);
  });

  it("retorna null quando não há nenhuma nota", () => {
    expect(average([])).toBeNull();
    expect(average([null, null])).toBeNull();
  });

  it("considera nota zero como nota válida", () => {
    expect(average([0, 4])).toBe(2);
  });

  it("mantém casas decimais", () => {
    expect(average([4.5, 4])).toBeCloseTo(4.25);
  });
});

describe("canManageCampaign", () => {
  it("admin gerencia qualquer campanha, inclusive sem ser autor", () => {
    expect(canManageCampaign({ user: { id: "adm" }, isAdmin: true }, "outro")).toBe(true);
  });

  it("autor sem papel de admin gerencia a própria campanha", () => {
    expect(canManageCampaign({ user: { id: "u1" }, isAdmin: false }, "u1")).toBe(true);
  });

  it("id vazio do autor não libera acesso", () => {
    expect(canManageCampaign({ user: { id: "u1" }, isAdmin: false }, "")).toBe(false);
  });
});
