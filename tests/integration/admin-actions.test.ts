import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { argsOf, createSupabaseMock, eqFilters, form, type SupabaseMock } from "../helpers/supabase";

// Integração: painel admin <-> requireAdmin (data.ts) <-> APIs externas (AniList/TMDB) <-> Supabase.
// Só o fetch global e o client Supabase são simulados; o resto do código roda de verdade.
const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  clearLibraryReview,
  createMedia,
  deleteMedia,
  importExternalMedia,
  setUserRole,
} from "@/app/(admin)/admin/actions";

const ADMIN = "admin-1";
let db: SupabaseMock;
let fetchMock: ReturnType<typeof vi.fn>;

function setupDb(role: "admin" | "user" | null) {
  db = createSupabaseMock({
    user: role ? { id: ADMIN } : null,
    respond: (q) => (q.table === "profiles" && q.ops.some((o) => o.method === "single") ? { data: { role } } : undefined),
  });
  mocks.createClient.mockResolvedValue(db.client);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDb("admin");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TMDB_API_READ_TOKEN", "");
  vi.stubEnv("TMDB_API_KEY", "");
  // Os erros de rede esperados são logados pelo http.ts; silenciamos no teste.
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("controle de acesso", () => {
  it.each([
    ["usuário comum", "user"],
    ["visitante", null],
  ])("%s não consegue cadastrar, excluir nem alterar papéis", async (_label, role) => {
    setupDb(role as "user" | null);
    await createMedia(form({ title: "Obra", type: "anime" }));
    await deleteMedia(form({ id: "m1" }));
    await setUserRole(form({ id: "u2", role: "admin" }));

    expect(db.queries("media", "insert")).toHaveLength(0);
    expect(db.queries("media", "delete")).toHaveLength(0);
    expect(db.queries("profiles", "update")).toHaveLength(0);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("createMedia", () => {
  it("cadastra obra manual com campos normalizados", async () => {
    const fd = form({
      type: "manga",
      title: "  Vagabond ",
      subtitle: "",
      synopsis: "Miyamoto Musashi",
      cover_url: "ftp://capa.png",
      release_year: "1998.6",
      total_units: "-3",
      genres: "Seinen, Ação, , Drama",
      publish_status: "draft",
    });

    await expect(createMedia(fd)).rejects.toThrow("NEXT_REDIRECT:/admin/catalogo");

    expect(argsOf(db.queries("media", "insert")[0], "insert")?.[0]).toEqual({
      type: "manga",
      title: "Vagabond",
      subtitle: null,
      synopsis: "Miyamoto Musashi",
      cover_url: null,
      release_year: 1998,
      total_units: null,
      genres: ["Seinen", "Ação", "Drama"],
      publish_status: "draft",
      external_source: "manual",
      created_by: ADMIN,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin", "layout");
  });

  it("usa valores padrão para tipo/status inválidos e limita a 8 gêneros", async () => {
    const genres = Array.from({ length: 12 }, (_, i) => `G${i}`).join(",");
    await expect(createMedia(form({ title: "X", type: "podcast", publish_status: "??", genres }))).rejects.toThrow("NEXT_REDIRECT");

    const row = argsOf(db.queries("media", "insert")[0], "insert")?.[0] as Record<string, unknown>;
    expect(row.type).toBe("anime");
    expect(row.publish_status).toBe("published");
    expect(row.genres).toHaveLength(8);
  });

  it("não cadastra obra sem título", async () => {
    await createMedia(form({ title: "   ", type: "anime" }));
    expect(db.queries("media", "insert")).toHaveLength(0);
  });
});

describe("importExternalMedia (AniList/TMDB -> catálogo)", () => {
  const anilistNaruto = {
    data: {
      Media: {
        id: 20,
        title: { romaji: "Naruto", english: "Naruto" },
        description: "Um ninja.<br>Outra linha.",
        coverImage: { extraLarge: "https://s4.anilist.co/n.jpg" },
        startDate: { year: 2002 },
        episodes: 220,
        genres: ["Action", "Adventure"],
        studios: { nodes: [{ name: "Pierrot" }] },
      },
    },
  };
  const importForm = (over: Record<string, string> = {}) =>
    form({ type: "anime", source: "anilist", external_id: "20", q: "naruto", tipo: "anime", ...over });

  it("busca a obra na API, grava no catálogo e volta para a busca com sucesso", async () => {
    fetchMock.mockResolvedValue(json(anilistNaruto));

    await expect(importExternalMedia(importForm())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/catalogo/importar?q=naruto&tipo=anime&ok=1",
    );

    // Os dados vêm do servidor (AniList), não do formulário.
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graphql.anilist.co");
    expect(JSON.parse(init.body).variables).toEqual({ id: 20, type: "ANIME" });

    const [row, options] = argsOf(db.queries("media", "upsert")[0], "upsert") ?? [];
    expect(row).toMatchObject({
      type: "anime",
      title: "Naruto",
      subtitle: "Pierrot",
      synopsis: "Um ninja.\nOutra linha.",
      release_year: 2002,
      total_units: 220,
      genres: ["Ação", "Aventura"],
      external_source: "anilist",
      external_id: "anime:20",
      publish_status: "published",
      created_by: ADMIN,
    });
    expect(options).toEqual({ onConflict: "external_source,external_id", ignoreDuplicates: true });
  });

  it("importa filme do TMDB usando o token do servidor", async () => {
    vi.stubEnv("TMDB_API_READ_TOKEN", "token-teste");
    fetchMock.mockResolvedValue(
      json({ id: 438631, title: "Duna", overview: "Arrakis", release_date: "2021-09-15", runtime: 155, genres: [{ id: 878, name: "Ficção científica" }] }),
    );

    await expect(importExternalMedia(importForm({ type: "movie", source: "tmdb", external_id: "438631", q: "duna", tipo: "all" }))).rejects.toThrow(
      "NEXT_REDIRECT:/admin/catalogo/importar?q=duna&tipo=all&ok=1",
    );

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token-teste");
    expect(argsOf(db.queries("media", "upsert")[0], "upsert")?.[0]).toMatchObject({
      type: "movie",
      title: "Duna",
      external_source: "tmdb",
      external_id: "movie:438631",
    });
  });

  it("API fora do ar: avisa o admin e não grava nada", async () => {
    fetchMock.mockResolvedValue(json({}, 500));
    await expect(importExternalMedia(importForm())).rejects.toThrow("NEXT_REDIRECT:/admin/catalogo/importar?q=naruto&tipo=anime&erro=api");
    expect(db.queries("media")).toHaveLength(0);
  });

  it("obra inexistente na API: erro nao-encontrada", async () => {
    fetchMock.mockResolvedValue(json({ data: { Media: null } }));
    await expect(importExternalMedia(importForm())).rejects.toThrow("erro=nao-encontrada");
    expect(db.queries("media")).toHaveLength(0);
  });

  it("erro do banco ao gravar: erro=db", async () => {
    fetchMock.mockResolvedValue(json(anilistNaruto));
    db.setResponder((q) => {
      if (q.table === "profiles") return { data: { role: "admin" } };
      if (q.table === "media") return { error: { message: "unique violation" } };
      return undefined;
    });
    await expect(importExternalMedia(importForm())).rejects.toThrow("erro=db");
  });

  it("fonte incompatível com o tipo é ignorada sem chamar a API", async () => {
    await importExternalMedia(importForm({ type: "movie", source: "anilist" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.queries("media")).toHaveLength(0);
  });
});

describe("moderação e usuários", () => {
  it("clearLibraryReview remove só o texto da crítica", async () => {
    await clearLibraryReview(form({ id: "entry-9" }));
    const update = db.queries("library_entries", "update")[0];
    expect(argsOf(update, "update")?.[0]).toEqual({ review: null });
    expect(eqFilters(update)).toEqual({ id: "entry-9" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/moderacao");
  });

  it("admin promove outro usuário e papéis desconhecidos viram 'user'", async () => {
    await setUserRole(form({ id: "u2", role: "admin" }));
    await setUserRole(form({ id: "u3", role: "superuser" }));
    const [promote, other] = db.queries("profiles", "update");
    expect(argsOf(promote, "update")?.[0]).toEqual({ role: "admin" });
    expect(eqFilters(promote)).toEqual({ id: "u2" });
    expect(argsOf(other, "update")?.[0]).toEqual({ role: "user" });
  });

  it("admin não consegue remover o próprio acesso", async () => {
    await setUserRole(form({ id: ADMIN, role: "user" }));
    expect(db.queries("profiles", "update")).toHaveLength(0);
  });
});
