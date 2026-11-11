"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/(site)/(auth)/actions";

export default function AuthForm({
  action,
  mode,
  next,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  mode: "login" | "signup";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <input name="username" required minLength={3} placeholder="Nome de usuário" className="input" />
      )}
      <input name="email" type="email" required placeholder="E-mail" className="input" />
      <input name="password" type="password" required placeholder="Senha" className="input" />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}
