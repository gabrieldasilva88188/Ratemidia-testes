import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Integração: middleware do Next (NextRequest/NextResponse reais) <-> sessão do Supabase.
// Só o @supabase/ssr é simulado, para controlar se há usuário logado.
const ssr = vi.hoisted(() => ({ createServerClient: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: ssr.createServerClient }));

import { NextRequest } from "next/server";
import { config, middleware } from "@/middleware";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };
type CookieAdapter = { cookies: { getAll(): unknown; setAll(c: CookieToSet[]): void } };

/** Simula o Supabase: usuário logado (ou não) e, opcionalmente, renovação de cookies de sessão. */
function session(user: { id: string } | null, renewed: CookieToSet[] = []) {
  ssr.createServerClient.mockImplementation((_url: string, _key: string, opts: CookieAdapter) => ({
    auth: {
      getUser: async () => {
        if (renewed.length) opts.cookies.setAll(renewed);
        return { data: { user } };
      },
    },
  }));
}

const request = (path: string) => new NextRequest(new URL(path, "http://localhost:3000"));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projeto-teste.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-teste");
});
afterEach(() => vi.unstubAllEnvs());

describe("middleware de autenticação", () => {
  it.each(["/minha-biblioteca", "/listas", "/listas/abc", "/campanhas/nova", "/admin", "/admin/usuarios"])(
    "visitante em %s é redirecionado para o login com ?next",
    async (path) => {
      session(null);
      const res = await middleware(request(path));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    },
  );

  it.each(["/", "/busca?q=frieren", "/campanhas", "/campanhas/123", "/obras/abc", "/login"])(
    "rota pública %s é liberada para visitantes",
    async (path) => {
      session(null);
      const res = await middleware(request(path));
      expect(res.headers.get("location")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("usuário logado acessa rotas protegidas", async () => {
    session({ id: "user-1" });
    const res = await middleware(request("/minha-biblioteca"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("repassa para a resposta os cookies de sessão renovados pelo Supabase", async () => {
    session({ id: "user-1" }, [{ name: "sb-access-token", value: "token-renovado", options: { path: "/" } }]);
    const res = await middleware(request("/listas"));
    expect(res.cookies.get("sb-access-token")?.value).toBe("token-renovado");
  });

  it("sem Supabase configurado (modo demonstração) libera tudo sem criar client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const res = await middleware(request("/admin"));
    expect(res.headers.get("location")).toBeNull();
    expect(ssr.createServerClient).not.toHaveBeenCalled();
  });
});

describe("matcher do middleware", () => {
  const pattern = new RegExp(`^${config.matcher[0]}$`);

  it("roda nas páginas", () => {
    for (const path of ["/", "/busca", "/admin/catalogo", "/obras/123"]) expect(pattern.test(path)).toBe(true);
  });

  it("ignora arquivos estáticos e imagens", () => {
    for (const path of ["/_next/static/chunk.js", "/_next/image", "/favicon.ico", "/capa.png", "/img/logo.svg"]) {
      expect(pattern.test(path)).toBe(false);
    }
  });
});
