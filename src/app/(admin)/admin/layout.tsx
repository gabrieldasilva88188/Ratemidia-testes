import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel de Administração · RateMedia" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", admin.id).single();
  const name = profile?.username ?? admin.email ?? "Admin";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="border-line bg-bg-soft p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r">
        <Link href="/admin" className="mb-4 flex items-center gap-3 px-2 py-2 lg:mb-8">
          <Clapperboard aria-hidden className="size-8 text-primary" />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold uppercase tracking-[-0.45px]">RateMedia</span>
            <span className="block text-[11px] font-bold uppercase tracking-wideLabel text-secondary">Admin Core</span>
          </span>
        </Link>
        <div className="lg:flex-1"><AdminNav /></div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-line bg-bg/80 px-6 py-3 backdrop-blur">
          <p className="text-sm text-ink-muted">Painel de Administração e Gestão de Mídia</p>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-strong text-xs font-bold text-primary-on">{name.slice(0, 2).toUpperCase()}</span>
            <span className="leading-tight">
              <span className="block text-sm font-bold">{name}</span>
              <span className="block text-xs text-ink-dim">Super Admin</span>
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] space-y-8 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
