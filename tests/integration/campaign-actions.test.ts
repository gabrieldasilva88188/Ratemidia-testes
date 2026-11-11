import { beforeEach, describe, expect, it, vi } from "vitest";
import { argsOf, createSupabaseMock, eqFilters, form, type QueryCall, type SupabaseMock } from "../helpers/supabase";

// Integração: actions de campanhas <-> getViewer/canManageCampaign (data.ts) <-> Supabase.
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
  createCampaign,
  deleteCampaign,
  submitCampaignReview,
  updateCampaign,
} from "@/app/(site)/campanhas/actions";

const AUTHOR = "author-1";
const valid = {
  title: "A Tumba da Aniquilação",
  system: "D&D 5e",
  synopsis: "Uma maldição drena a vida dos ressuscitados.",
};

let db: SupabaseMock;

/** Simula o banco: papel do usuário em profiles e autor da campanha. */
function setupDb(opts: { userId: string | null; role?: "user" | "admin"; authorId?: string | null }) {
  db = createSupabaseMock({
    user: opts.userId ? { id: opts.userId } : null,
    respond: (q: QueryCall) => {
      const methods = q.ops.map((o) => o.method);
      if (q.table === "profiles") return { data: { role: opts.role ?? "user" } };
      if (q.table === "campaigns" && methods.includes("insert")) return { data: { id: "camp-nova" } };
      if (q.table === "campaigns" && methods.includes("maybeSingle")) {
        return { data: opts.authorId ? { author_id: opts.authorId } : null };
      }
      return undefined;
    },
  });
  mocks.createClient.mockResolvedValue(db.client);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDb({ userId: AUTHOR, authorId: AUTHOR });
});

const inserted = () => argsOf(db.queries("campaigns", "insert")[0], "insert")?.[0] as Record<string, unknown>;

describe("createCampaign", () => {
  it("visitante é enviado ao login", async () => {
    setupDb({ userId: null });
    await expect(createCampaign(form(valid))).rejects.toThrow("NEXT_REDIRECT:/login?next=/campanhas/nova");
    expect(db.queries("campaigns", "insert")).toHaveLength(0);
  });

  it("cria a campanha com o autor logado e abre a página dela", async () => {
    await expect(createCampaign(form({ ...valid, status: "ongoing" }))).rejects.toThrow("NEXT_REDIRECT:/campanhas/camp-nova");

    expect(inserted()).toMatchObject({ author_id: AUTHOR, ...valid, status: "ongoing", rules: null, cover_url: null });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/campanhas");
  });

  it("não grava nada quando faltam campos obrigatórios", async () => {
    await createCampaign(form({ title: "Só título", system: "", synopsis: "" }));
    expect(db.queries("campaigns", "insert")).toHaveLength(0);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("sanitiza a entrada: limita tamanho, aceita só URL http(s) e status conhecido", async () => {
    const fd = form({
      ...valid,
      title: "x".repeat(300),
      cover_url: "javascript:alert(1)",
      status: "status-inventado",
    });
    await expect(createCampaign(fd)).rejects.toThrow("NEXT_REDIRECT");

    expect((inserted().title as string).length).toBe(150);
    expect(inserted().cover_url).toBeNull();
    expect(inserted().status).toBe("recruiting");
  });

  it("mantém capa com URL https", async () => {
    await expect(createCampaign(form({ ...valid, cover_url: "https://img.exemplo.com/capa.png" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(inserted().cover_url).toBe("https://img.exemplo.com/capa.png");
  });
});

describe("submitCampaignReview", () => {
  it("limita a nota entre 0 e 5 e faz upsert por campanha+usuário", async () => {
    await submitCampaignReview("camp-1", form({ rating: "9", comment: "  Mestre excelente  " }));

    const [row, options] = argsOf(db.queries("campaign_reviews", "upsert")[0], "upsert") ?? [];
    expect(row).toEqual({ campaign_id: "camp-1", user_id: AUTHOR, rating: 5, comment: "Mestre excelente" });
    expect(options).toEqual({ onConflict: "campaign_id,user_id" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/campanhas/camp-1");
  });

  it("nota negativa vira 0 e comentário vazio vira null", async () => {
    await submitCampaignReview("camp-1", form({ rating: "-3", comment: "" }));
    const [row] = argsOf(db.queries("campaign_reviews", "upsert")[0], "upsert") ?? [];
    expect(row).toMatchObject({ rating: 0, comment: null });
  });

  it("visitante é enviado ao login da campanha", async () => {
    setupDb({ userId: null });
    await expect(submitCampaignReview("camp-1", form({ rating: "4" }))).rejects.toThrow("NEXT_REDIRECT:/login?next=/campanhas/camp-1");
  });
});

describe("updateCampaign (autor ou admin)", () => {
  it("autor consegue editar e é redirecionado para a campanha", async () => {
    await expect(updateCampaign(form({ id: "camp-1", ...valid }))).rejects.toThrow("NEXT_REDIRECT:/campanhas/camp-1");

    const update = db.queries("campaigns", "update")[0];
    expect(argsOf(update, "update")?.[0]).toMatchObject(valid);
    expect(eqFilters(update)).toEqual({ id: "camp-1" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/campanhas");
  });

  it("admin consegue editar campanha de outro usuário", async () => {
    setupDb({ userId: "admin-1", role: "admin", authorId: AUTHOR });
    await expect(updateCampaign(form({ id: "camp-1", ...valid }))).rejects.toThrow("NEXT_REDIRECT:/campanhas/camp-1");
    expect(db.queries("campaigns", "update")).toHaveLength(1);
  });

  it("outro usuário comum não altera nada", async () => {
    setupDb({ userId: "intruso", role: "user", authorId: AUTHOR });
    await updateCampaign(form({ id: "camp-1", ...valid }));
    expect(db.queries("campaigns", "update")).toHaveLength(0);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("campanha inexistente não é alterada", async () => {
    setupDb({ userId: AUTHOR, authorId: null });
    await updateCampaign(form({ id: "nao-existe", ...valid }));
    expect(db.queries("campaigns", "update")).toHaveLength(0);
  });
});

describe("deleteCampaign", () => {
  it("só aceita destinos de retorno conhecidos", async () => {
    await expect(deleteCampaign(form({ id: "camp-1", redirect_to: "https://site-malicioso.com" }))).rejects.toThrow(
      "NEXT_REDIRECT:/campanhas",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/campanhas");
  });

  it("volta ao painel admin quando a exclusão veio de lá", async () => {
    setupDb({ userId: "admin-1", role: "admin", authorId: AUTHOR });
    await expect(deleteCampaign(form({ id: "camp-1", redirect_to: "/admin/campanhas" }))).rejects.toThrow(
      "NEXT_REDIRECT:/admin/campanhas",
    );
    expect(eqFilters(db.queries("campaigns", "delete")[0])).toEqual({ id: "camp-1" });
  });

  it("visitante é enviado ao login e nada é excluído", async () => {
    setupDb({ userId: null });
    await expect(deleteCampaign(form({ id: "camp-1" }))).rejects.toThrow("NEXT_REDIRECT:/login?next=/campanhas/camp-1");
    expect(db.queries("campaigns", "delete")).toHaveLength(0);
  });
});
