import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, form, type SupabaseMock } from "../helpers/supabase";

// Integração: Server Actions de autenticação <-> client Supabase <-> cache/rotas do Next.
const mocks = vi.hoisted(() => ({
  // Como no Next real, redirect() interrompe a execução lançando um erro.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { signIn, signOut, signUp } from "@/app/(site)/(auth)/actions";

let db: SupabaseMock;
beforeEach(() => {
  vi.clearAllMocks();
  db = createSupabaseMock();
  mocks.createClient.mockResolvedValue(db.client);
});

describe("signIn", () => {
  it("envia e-mail e senha ao Supabase Auth e redireciona para o destino informado", async () => {
    const fd = form({ email: "ana@exemplo.com", password: "segredo1", next: "/minha-biblioteca" });

    await expect(signIn(undefined, fd)).rejects.toThrow("NEXT_REDIRECT:/minha-biblioteca");

    expect(db.client.auth.signInWithPassword).toHaveBeenCalledWith({ email: "ana@exemplo.com", password: "segredo1" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("retorna mensagem amigável e não redireciona quando as credenciais são inválidas", async () => {
    db.client.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: "Invalid login credentials" } });

    const result = await signIn(undefined, form({ email: "ana@exemplo.com", password: "errada" }));

    expect(result).toEqual({ error: "E-mail ou senha inválidos." });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("ignora destinos externos no parâmetro next (evita redirecionamento aberto)", async () => {
    const fd = form({ email: "a@b.com", password: "123456", next: "https://site-malicioso.com" });
    await expect(signIn(undefined, fd)).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("usa a home quando next não é enviado", async () => {
    await expect(signIn(undefined, form({ email: "a@b.com", password: "123456" }))).rejects.toThrow("NEXT_REDIRECT:/");
  });
});

describe("signUp", () => {
  it("valida a senha antes de chamar o Supabase", async () => {
    const result = await signUp(undefined, form({ email: "a@b.com", password: "123", username: "ana" }));

    expect(result).toEqual({ error: "A senha deve ter ao menos 6 caracteres." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("cria a conta com o username (sem espaços) nos metadados e volta para a home", async () => {
    const fd = form({ email: "ana@exemplo.com", password: "segredo1", username: "  ana_rpg  " });

    await expect(signUp(undefined, fd)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(db.client.auth.signUp).toHaveBeenCalledWith({
      email: "ana@exemplo.com",
      password: "segredo1",
      options: { data: { username: "ana_rpg" } },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("repassa o erro do Supabase (ex.: e-mail já cadastrado)", async () => {
    db.client.auth.signUp.mockResolvedValueOnce({ data: {}, error: { message: "User already registered" } });

    const result = await signUp(undefined, form({ email: "ana@exemplo.com", password: "segredo1", username: "ana" }));

    expect(result).toEqual({ error: "User already registered" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("encerra a sessão, invalida o layout e redireciona para a home", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(db.client.auth.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
