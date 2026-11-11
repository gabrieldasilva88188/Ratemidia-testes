import { beforeEach, describe, expect, it, vi } from "vitest";
import { argsOf, createSupabaseMock, type SupabaseMock } from "../helpers/supabase";

// Integração: agregações de notas/popularidade (data.ts) <-> consultas ao Supabase.
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { campaignRatings, campaignStats, getViewer, mediaRatings, mediaStats, requireAdmin } from "@/lib/data";

let db: SupabaseMock;
beforeEach(() => {
  vi.clearAllMocks();
  db = createSupabaseMock();
  mocks.createClient.mockResolvedValue(db.client);
});

describe("notas e popularidade", () => {
  it("mediaStats calcula média ignorando entradas sem nota e conta avaliações", async () => {
    db.setResponder((q) =>
      q.table === "library_entries"
        ? {
            data: [
              { media_id: "a", rating: 5 },
              { media_id: "a", rating: 4 },
              { media_id: "a", rating: null },
              { media_id: "b", rating: 3 },
            ],
          }
        : undefined,
    );

    const stats = await mediaStats(["a", "b", "c"]);

    expect(stats.get("a")).toEqual({ avg: 4.5, count: 3 });
    expect(stats.get("b")).toEqual({ avg: 3, count: 1 });
    expect(stats.get("c")).toEqual({ avg: null, count: 0 });
    expect(argsOf(db.queries("library_entries")[0], "in")).toEqual(["media_id", ["a", "b", "c"]]);
  });

  it("mediaRatings devolve só a média por obra", async () => {
    db.setResponder(() => ({ data: [{ media_id: "x", rating: 2 }, { media_id: "x", rating: 3 }] }));
    const ratings = await mediaRatings(["x", "y"]);
    expect(ratings.get("x")).toBe(2.5);
    expect(ratings.get("y")).toBeNull();
  });

  it("campaignRatings/campaignStats convertem notas numéricas vindas como texto (numeric do Postgres)", async () => {
    db.setResponder((q) =>
      q.table === "campaign_reviews"
        ? { data: [{ campaign_id: "c1", rating: "4.5" }, { campaign_id: "c1", rating: "3.5" }] }
        : undefined,
    );
    expect((await campaignRatings(["c1"])).get("c1")).toBe(4);
    expect((await campaignStats(["c1", "c2"])).get("c2")).toEqual({ avg: null, count: 0 });
  });

  it("lista vazia não consulta o banco", async () => {
    expect((await mediaStats([])).size).toBe(0);
    expect((await campaignRatings([])).size).toBe(0);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("banco sem dados (data null) não quebra a página", async () => {
    db.setResponder(() => ({ data: null }));
    expect((await mediaStats(["a"])).get("a")).toEqual({ avg: null, count: 0 });
  });
});

describe("sessão e permissões", () => {
  it("getViewer retorna null para visitantes", async () => {
    expect(await getViewer()).toBeNull();
  });

  it("getViewer identifica administradores pelo perfil", async () => {
    db.setUser({ id: "u1" });
    db.setResponder((q) => (q.table === "profiles" ? { data: { role: "admin" } } : undefined));
    expect(await getViewer()).toEqual({ user: { id: "u1" }, isAdmin: true });
  });

  it("requireAdmin devolve o usuário só quando o papel é admin", async () => {
    db.setUser({ id: "u1" });
    db.setResponder((q) => (q.table === "profiles" ? { data: { role: "user" } } : undefined));
    expect(await requireAdmin()).toBeNull();

    db.setResponder((q) => (q.table === "profiles" ? { data: { role: "admin" } } : undefined));
    expect(await requireAdmin()).toEqual({ id: "u1" });
  });
});
