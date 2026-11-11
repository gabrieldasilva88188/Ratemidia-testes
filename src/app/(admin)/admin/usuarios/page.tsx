import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data";
import { monthYear } from "@/lib/format";
import type { Profile } from "@/types";
import { setUserRole } from "../actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  const users = (data ?? []) as Profile[];

  return (
    <>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Usuários e Permissões</h1>
        <p className="text-ink-muted">Promova ou remova administradores. Você não pode alterar o seu próprio papel.</p>
      </header>
      <section className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-bg text-[11px] font-bold uppercase tracking-label text-ink-dim">
            <tr><th className="px-6 py-3">Usuário</th><th className="px-3 py-3">Membro desde</th><th className="px-3 py-3">Papel</th><th className="px-6 py-3"><span className="sr-only">Ação</span></th></tr>
          </thead>
          <tbody className="divide-y divide-surface-high">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-high/60">
                <td className="px-6 py-3 font-bold">@{u.username}</td>
                <td className="px-3 py-3 text-ink-muted">{monthYear(u.created_at)}</td>
                <td className="px-3 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${u.role === "admin" ? "bg-secondary/15 text-secondary" : "bg-surface-highest text-ink-muted"}`}>{u.role === "admin" ? "Administrador" : "Usuário"}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  {u.id !== me?.id && (
                    <form action={setUserRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="role" value={u.role === "admin" ? "user" : "admin"} />
                      <button className="btn-ghost border border-line !py-1 text-xs">{u.role === "admin" ? "Remover admin" : "Tornar admin"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
