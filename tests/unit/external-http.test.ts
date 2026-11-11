import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "@/lib/external/http";
import { cleanDescription } from "@/lib/external/anilist";
import { translateGenre } from "@/lib/external/genres";
import { ExternalApiError, SOURCES_BY_TYPE, storageId } from "@/lib/external/types";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("fetchJson", () => {
  it("faz GET com Accept JSON e devolve o corpo", async () => {
    fetchMock.mockResolvedValue(ok({ hello: "mundo" }));

    expect(await fetchJson("https://api.exemplo.com/x", { headers: { "X-Teste": "1" } })).toEqual({ hello: "mundo" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json", "X-Teste": "1" });
    expect(init.next).toEqual({ revalidate: 3600 });
  });

  it("vira POST JSON quando recebe body", async () => {
    fetchMock.mockResolvedValue(ok({}));
    await fetchJson("https://api.exemplo.com/graphql", { body: { query: "{ a }" }, revalidate: 60 });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ query: "{ a }" });
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.next).toEqual({ revalidate: 60 });
  });

  it("status de erro vira ExternalApiError com o código HTTP", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));

    const error = (await fetchJson("https://api.exemplo.com/x").catch((e: unknown) => e)) as ExternalApiError;
    expect(error).toBeInstanceOf(ExternalApiError);
    expect(error.status).toBe(503);
    expect(error.message).toContain("503");
    expect(fetchMock).toHaveBeenCalledTimes(1); // só 429 e falha de rede são repetidos
  });

  it("timeout gera mensagem específica", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
    await expect(fetchJson("https://api.exemplo.com/x", { retries: 0 })).rejects.toThrow(/demorou demais/);
  });

  it("429 sem tentativas restantes é reportado como erro", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429 }));
    await expect(fetchJson("https://api.exemplo.com/x", { retries: 0 })).rejects.toMatchObject({ status: 429 });
  });
});

describe("normalização de dados externos", () => {
  it("storageId inclui o tipo para não colidir ids iguais de fontes diferentes", () => {
    expect(storageId({ type: "movie", external_id: "550" })).toBe("movie:550");
    expect(storageId({ type: "series", external_id: "550" })).toBe("series:550");
  });

  it("cada tipo de mídia aceita apenas as fontes corretas", () => {
    expect(SOURCES_BY_TYPE.anime).toEqual(["anilist", "jikan"]);
    expect(SOURCES_BY_TYPE.movie).toEqual(["tmdb"]);
  });

  it("cleanDescription remove HTML e decodifica entidades", () => {
    expect(cleanDescription("A&lt;B&gt; &quot;C&quot; &#039;D&#039;<br><br><br><br>Fim")).toBe("A<B> \"C\" 'D'\n\nFim");
    expect(cleanDescription("   ")).toBeNull();
    expect(cleanDescription(null)).toBeNull();
  });

  it("translateGenre traduz gêneros conhecidos e mantém os desconhecidos", () => {
    expect(translateGenre("Action")).toBe("Ação");
    expect(translateGenre("Gênero Inventado")).toBe("Gênero Inventado");
  });
});
