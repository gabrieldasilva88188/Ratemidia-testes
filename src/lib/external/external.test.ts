import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJikan, mapJikan, searchJikan } from "./jikan";
import { getTmdb, searchTmdb } from "./tmdb";
import { fetchExternal } from "./index";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const status = (code: number) => new Response("{}", { status: code });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TMDB_API_READ_TOKEN", "");
  vi.stubEnv("TMDB_API_KEY", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("jikan", () => {
  const item = {
    mal_id: 5114,
    title: "Hagane no Renkinjutsushi",
    title_english: "Fullmetal Alchemist: Brotherhood",
    synopsis: "  Dois irmãos.  ",
    year: 2009,
    episodes: 64,
    images: { webp: { large_image_url: "https://cdn.myanimelist.net/a.webp" } },
    studios: [{ name: "Bones" }],
    genres: [{ name: "Action" }, { name: "Sci-Fi" }],
    demographics: [{ name: "Shounen" }],
    themes: [{ name: "Military" }, { name: "Action" }],
  };

  it("normaliza e traduz gêneros, sem duplicar", () => {
    const m = mapJikan("anime", item);
    expect(m).toMatchObject({
      source: "jikan",
      external_id: "5114",
      type: "anime",
      title: "Fullmetal Alchemist: Brotherhood",
      subtitle: "Bones",
      synopsis: "Dois irmãos.",
      release_year: 2009,
      total_units: 64,
    });
    expect(m.genres).toEqual(["Ação", "Ficção Científica", "Shonen", "Military"]);
  });

  it("usa autores como subtítulo em mangás", () => {
    const m = mapJikan("manga", { ...item, studios: [], authors: [{ name: "Arakawa, Hiromu" }], chapters: 116, episodes: null });
    expect(m.subtitle).toBe("Arakawa, Hiromu");
    expect(m.total_units).toBe(116);
  });

  it("busca com sfw e ignora consulta vazia", async () => {
    fetchMock.mockResolvedValue(ok({ data: [item] }));
    expect(await searchJikan("anime", "  ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    const res = await searchJikan("anime", "fullmetal");
    expect(res).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("sfw=true");
  });

  it("repete uma vez após 429", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(status(429)).mockResolvedValueOnce(ok({ data: [item] }));
    const p = searchJikan("anime", "x");
    await vi.advanceTimersByTimeAsync(1200);
    expect(await p).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("repete após falha de rede e depois informa o erro", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const p = searchJikan("anime", "x");
    const assertion = expect(p).rejects.toThrow(/conectar/);
    await vi.advanceTimersByTimeAsync(1200);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("getJikan: id inválido e 404 retornam null", async () => {
    expect(await getJikan("anime", "abc/../")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValue(status(404));
    expect(await getJikan("anime", "1")).toBeNull();
  });
});

describe("tmdb", () => {
  const genres = { genres: [{ id: 28, name: "Ação" }, { id: 12, name: "Aventura" }] };
  const route = (search: unknown) => (url: string) =>
    Promise.resolve(String(url).includes("/genre/") ? ok(genres) : ok(search));

  it("retorna vazio sem credenciais", async () => {
    expect(await searchTmdb("movie", "duna")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("usa Bearer quando há token de leitura", async () => {
    vi.stubEnv("TMDB_API_READ_TOKEN", "tok");
    fetchMock.mockImplementation(route({ results: [] }));
    await searchTmdb("movie", "duna");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("api_key");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("usa api_key v3 como alternativa e mapeia filme", async () => {
    vi.stubEnv("TMDB_API_KEY", "k3y");
    fetchMock.mockImplementation(
      route({
        results: [{ id: 438631, title: "Duna", overview: "Arrakis", poster_path: "/d.jpg", release_date: "2021-09-15", genre_ids: [28, 12, 999] }],
      }),
    );
    const [m] = await searchTmdb("movie", "duna");
    expect(String(fetchMock.mock.calls[0][0])).toContain("api_key=k3y");
    expect(m).toMatchObject({
      source: "tmdb",
      external_id: "438631",
      type: "movie",
      title: "Duna",
      cover_url: "https://image.tmdb.org/t/p/w500/d.jpg",
      release_year: 2021,
      total_units: 1,
      genres: ["Ação", "Aventura"],
    });
  });

  it("série: nº de episódios e emissora vêm do detalhe", async () => {
    vi.stubEnv("TMDB_API_READ_TOKEN", "tok");
    fetchMock.mockResolvedValue(
      ok({ id: 1396, name: "Breaking Bad", first_air_date: "2008-01-20", number_of_episodes: 62, networks: [{ name: "AMC" }], genres: [{ id: 18, name: "Drama" }] }),
    );
    const m = await getTmdb("series", "1396");
    expect(m).toMatchObject({ type: "series", total_units: 62, subtitle: "AMC", genres: ["Drama"], release_year: 2008 });
  });

  it("data ausente vira release_year null", async () => {
    vi.stubEnv("TMDB_API_READ_TOKEN", "tok");
    fetchMock.mockImplementation(route({ results: [{ id: 1, title: "X", overview: "" }] }));
    const [m] = await searchTmdb("movie", "x");
    expect(m.release_year).toBeNull();
    expect(m.synopsis).toBeNull();
  });
});

describe("fetchExternal", () => {
  it("roteia por tipo", async () => {
    fetchMock.mockResolvedValue(ok({ data: { mal_id: 1, title: "A", synopsis: null } }));
    expect((await fetchExternal("manga", "1", "jikan"))?.source).toBe("jikan");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/manga/1/full");
  });
});

describe("anilist", () => {
  const media = {
    id: 20,
    title: { romaji: "Naruto", english: "Naruto" },
    description: "Um ninja.<br><br>Outro <i>parágrafo</i> &amp; mais.",
    coverImage: { extraLarge: "https://s4.anilist.co/n.jpg" },
    startDate: { year: 2002 },
    episodes: 220,
    genres: ["Action", "Psychological"],
    studios: { nodes: [{ name: "Pierrot" }] },
    staff: { edges: [{ role: "Story & Art", node: { name: { full: "Masashi Kishimoto" } } }] },
  };

  it("normaliza anime, limpa HTML e traduz gêneros", async () => {
    const { mapAnilist } = await import("./anilist");
    expect(mapAnilist("anime", media)).toMatchObject({
      source: "anilist",
      external_id: "20",
      subtitle: "Pierrot",
      synopsis: "Um ninja.\n\nOutro parágrafo & mais.",
      release_year: 2002,
      total_units: 220,
      genres: ["Ação", "Psicológico"],
    });
  });

  it("usa roteiristas/artistas como subtítulo em mangá", async () => {
    const { mapAnilist } = await import("./anilist");
    expect(mapAnilist("manga", { ...media, episodes: null, chapters: 700 })).toMatchObject({
      subtitle: "Masashi Kishimoto",
      total_units: 700,
    });
  });

  it("envia POST GraphQL com o tipo certo", async () => {
    const { searchAnilist } = await import("./anilist");
    fetchMock.mockResolvedValue(ok({ data: { Page: { media: [media] } } }));
    expect(await searchAnilist("manga", "naruto")).toHaveLength(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).variables).toMatchObject({ search: "naruto", type: "MANGA" });
  });
});

describe("searchExternal (fallback)", () => {
  it("cai para o Jikan quando o AniList está inacessível", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { searchExternal } = await import("./index");
    fetchMock.mockImplementation((url: string) =>
      String(url).includes("anilist") ? Promise.reject(new TypeError("fetch failed")) : Promise.resolve(ok({ data: [{ mal_id: 1, title: "A", synopsis: null }] })),
    );
    const p = searchExternal("anime", "a");
    await vi.advanceTimersByTimeAsync(2500);
    const res = await p;
    expect(res[0].source).toBe("jikan");
  });

  it("fetchExternal rejeita fonte incompatível com o tipo", async () => {
    const { fetchExternal } = await import("./index");
    expect(await fetchExternal("movie", "1", "jikan")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("busca em todas as mídias", () => {
  it("junta os tipos e informa qual falhou", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("TMDB_API_READ_TOKEN", "tok");
    const { searchAllExternal } = await import("./index");
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("/search/tv") || u.includes("/genre/tv")) return Promise.reject(new TypeError("fetch failed"));
      if (u.includes("/genre/")) return Promise.resolve(ok({ genres: [] }));
      if (u.includes("/search/movie")) return Promise.resolve(ok({ results: [{ id: 1, title: "Filme" }] }));
      return Promise.resolve(ok({ data: { Page: { media: [{ id: 7, title: { romaji: "Obra" } }] } } }));
    });
    const p = searchAllExternal("x");
    await vi.advanceTimersByTimeAsync(2500);
    const { results, failed } = await p;
    expect(failed).toEqual(["series"]);
    expect(results.map((r) => r.type).sort()).toEqual(["anime", "manga", "movie"]);
  });

  it("storageId separa anime e mangá com o mesmo id", async () => {
    const { storageId } = await import("./types");
    expect(storageId({ type: "anime", external_id: "20" })).not.toBe(storageId({ type: "manga", external_id: "20" }));
  });
});
