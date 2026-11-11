import { beforeEach, describe, expect, it, vi } from "vitest";
import { argsOf, createSupabaseMock, eqFilters, form, type QueryCall, type QueryResult, type SupabaseMock } from "../helpers/supabase";

// Integração: botão "Adicionar à lista" e página Minhas Listas <-> tabelas lists/list_items.
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

import { createListWithMedia, getMyListsForMedia, setMediaInList } from "@/lib/actions/lists";
import { createList, deleteList, updateProfile } from "@/app/(site)/(app)/listas/actions";

const USER = "user-1";
const MEDIA = "11111111-1111-4111-8111-111111111111";
const OTHER_MEDIA = "22222222-2222-4222-8222-222222222222";
const LIST = "33333333-3333-4333-8333-333333333333";

let db: SupabaseMock;
const has = (q: QueryCall, method: string) => q.ops.some((o) => o.method === method);

function setup(respond: (q: QueryCall) => QueryResult | undefined = () => undefined, user: string | null = USER) {
  db = createSupabaseMock({ user: user ? { id: user } : null, respond });
  mocks.createClient.mockResolvedValue(db.client);
}

beforeEach(() => {
  vi.clearAllMocks();
  setup();
});

describe("getMyListsForMedia", () => {
  it("rejeita id de obra inválido sem consultar o banco", async () => {
    expect(await getMyListsForMedia("1; drop table lists")).toEqual({ status: "error", message: "Obra inválida." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("pede login quando não há sessão", async () => {
    setup(undefined, null);
    expect(await getMyListsForMedia(MEDIA)).toEqual({ status: "login" });
  });

  it("lista só as listas do usuário e marca onde a obra já está", async () => {
    setup((q) =>
      q.table === "lists"
        ? {
            data: [
              { id: "l1", title: "Favoritos", is_public: true, list_items: [{ media_id: MEDIA }, { media_id: OTHER_MEDIA }] },
              { id: "l2", title: "Para ver", is_public: false, list_items: [] },
            ],
          }
        : undefined,
    );

    const result = await getMyListsForMedia(MEDIA);

    expect(result).toEqual({
      status: "ok",
      lists: [
        { id: "l1", title: "Favoritos", is_public: true, count: 2, hasMedia: true },
        { id: "l2", title: "Para ver", is_public: false, count: 0, hasMedia: false },
      ],
    });
    expect(eqFilters(db.queries("lists")[0])).toEqual({ user_id: USER });
  });

  it("retorna erro amigável quando o banco falha", async () => {
    setup(() => ({ error: { message: "timeout" } }));
    expect(await getMyListsForMedia(MEDIA)).toEqual({ status: "error", message: "Não foi possível carregar suas listas." });
  });
});

describe("setMediaInList", () => {
  it("não permite mexer em lista de outro usuário", async () => {
    setup((q) => (q.table === "lists" ? { data: null } : undefined));

    expect(await setMediaInList(LIST, MEDIA, true)).toEqual({ status: "error", message: "Lista não encontrada." });
    expect(db.queries("list_items", "insert")).toHaveLength(0);
    expect(eqFilters(db.queries("lists")[0])).toEqual({ id: LIST, user_id: USER });
  });

  it("adiciona a obra na próxima posição da lista", async () => {
    setup((q) => {
      if (q.table === "lists") return { data: { id: LIST } };
      if (q.table === "list_items" && has(q, "maybeSingle")) return { data: { position: 4 } };
      return undefined;
    });

    expect(await setMediaInList(LIST, MEDIA, true)).toEqual({ status: "ok" });
    expect(argsOf(db.queries("list_items", "insert")[0], "insert")?.[0]).toEqual({ list_id: LIST, media_id: MEDIA, position: 5 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/listas/${LIST}`);
  });

  it("primeira obra de uma lista vazia fica na posição 0", async () => {
    setup((q) => (q.table === "lists" ? { data: { id: LIST } } : undefined));
    await setMediaInList(LIST, MEDIA, true);
    expect(argsOf(db.queries("list_items", "insert")[0], "insert")?.[0]).toMatchObject({ position: 0 });
  });

  it("obra repetida (erro 23505) é tratada como sucesso", async () => {
    setup((q) => {
      if (q.table === "lists") return { data: { id: LIST } };
      if (q.table === "list_items" && has(q, "insert")) return { error: { message: "duplicate key", code: "23505" } };
      return undefined;
    });
    expect(await setMediaInList(LIST, MEDIA, true)).toEqual({ status: "ok" });
  });

  it("outros erros do banco viram mensagem para o usuário", async () => {
    setup((q) => {
      if (q.table === "lists") return { data: { id: LIST } };
      if (q.table === "list_items" && has(q, "insert")) return { error: { message: "boom", code: "XX000" } };
      return undefined;
    });
    expect(await setMediaInList(LIST, MEDIA, true)).toEqual({ status: "error", message: "Não foi possível adicionar à lista." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("remove apenas a obra informada daquela lista", async () => {
    setup((q) => (q.table === "lists" ? { data: { id: LIST } } : undefined));

    expect(await setMediaInList(LIST, MEDIA, false)).toEqual({ status: "ok" });
    expect(eqFilters(db.queries("list_items", "delete")[0])).toEqual({ list_id: LIST, media_id: MEDIA });
  });

  it("valida os ids antes de tudo", async () => {
    expect(await setMediaInList("abc", MEDIA, true)).toEqual({ status: "error", message: "Dados inválidos." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("createListWithMedia", () => {
  it("exige um nome", async () => {
    expect(await createListWithMedia("   ", true, MEDIA)).toEqual({ status: "error", message: "Dê um nome para a lista." });
  });

  it("cria a lista e já adiciona a obra nela", async () => {
    // A mesma resposta serve para o insert da lista e para a checagem de dono.
    setup((q) => (q.table === "lists" ? { data: { id: LIST } } : undefined));

    expect(await createListWithMedia("  Melhores de 2024  ", false, MEDIA)).toEqual({ status: "ok" });
    expect(argsOf(db.queries("lists", "insert")[0], "insert")?.[0]).toEqual({ user_id: USER, title: "Melhores de 2024", is_public: false });
    expect(argsOf(db.queries("list_items", "insert")[0], "insert")?.[0]).toMatchObject({ list_id: LIST, media_id: MEDIA });
  });

  it("falha ao criar a lista não tenta inserir itens", async () => {
    setup((q) => (q.table === "lists" ? { error: { message: "rls" } } : undefined));
    expect(await createListWithMedia("Nova", true, MEDIA)).toEqual({ status: "error", message: "Não foi possível criar a lista." });
    expect(db.queries("list_items")).toHaveLength(0);
  });
});

describe("actions da página Minhas Listas", () => {
  it("createList grava título/descrição limpos e visibilidade", async () => {
    await createList(form({ title: "  Animes de inverno ", description: "", is_public: "on" }));
    expect(argsOf(db.queries("lists", "insert")[0], "insert")?.[0]).toEqual({
      user_id: USER,
      title: "Animes de inverno",
      description: null,
      is_public: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/listas");
  });

  it("createList ignora visitantes e títulos vazios", async () => {
    await createList(form({ title: "   " }));
    setup(undefined, null);
    await createList(form({ title: "Válido" }));
    expect(db.queries("lists", "insert")).toHaveLength(0);
  });

  it("deleteList filtra pelo dono além do id", async () => {
    await expect(deleteList(form({ id: LIST }))).rejects.toThrow("NEXT_REDIRECT:/listas");
    expect(eqFilters(db.queries("lists", "delete")[0])).toEqual({ id: LIST, user_id: USER });
  });

  it("updateProfile aceita apenas URLs http(s) para avatar e banner", async () => {
    await updateProfile(
      form({ bio: " Fã de RPG ", location: "", avatar_url: "https://cdn.exemplo.com/a.png", banner_url: "data:text/html;base64,xxx" }),
    );
    const update = db.queries("profiles", "update")[0];
    expect(argsOf(update, "update")?.[0]).toEqual({
      bio: "Fã de RPG",
      location: null,
      avatar_url: "https://cdn.exemplo.com/a.png",
      banner_url: null,
    });
    expect(eqFilters(update)).toEqual({ id: USER });
  });
});
