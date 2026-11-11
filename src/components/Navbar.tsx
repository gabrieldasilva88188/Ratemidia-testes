import Link from "next/link";
import { Bell, BookmarkPlus, Clapperboard } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/(site)/(auth)/actions";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/busca", label: "Descobrir" },
  { href: "/busca?tipo=anime", label: "Animes" },
  { href: "/busca?tipo=manga", label: "Mangás" },
  { href: "/busca?tipo=series", label: "Séries" },
  { href: "/busca?tipo=movie", label: "Filmes" },
  { href: "/campanhas", label: "Campanhas RPG" },
  { href: "/listas", label: "Minhas Listas" },
];

export default async function Navbar() {
  let username: string | null = null;
  let isAdmin = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();
      username = profile?.username ?? user.email ?? null;
      isAdmin = profile?.role === "admin";
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-bg/80 shadow-[0_1px_8px_rgba(0,0,0,0.4)] backdrop-blur-[24px]">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Clapperboard aria-hidden className="size-7 text-primary" />
            <span className="text-lg font-extrabold uppercase tracking-[-0.45px]">
              RateMedia
            </span>
          </Link>
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded px-2 py-1 text-xs font-semibold tracking-[0.24px] text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mx-auto hidden min-w-0 flex-1 px-2 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {username ? (
            <>
              <Link href="/listas" className="btn-primary !px-4 !py-1 !text-xs">
                <BookmarkPlus aria-hidden className="size-3" />
                Criar Lista
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 rounded bg-surface px-2 py-1 text-xs font-semibold text-ink-muted hover:bg-surface-high"
                >
                  Admin
                  <span className="rounded-full bg-secondary-strong px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-label text-secondary-on">
                    Staff
                  </span>
                </Link>
              )}
              <button
                type="button"
                aria-label="Notificações"
                className="relative rounded-full p-1 text-ink-muted hover:text-ink"
              >
                <Bell aria-hidden className="size-4" />
                <span className="absolute right-1 top-1 size-2 rounded-full bg-secondary shadow-[0_0_8px_#7bd0ff]" />
              </button>
              <UserMenu username={username} isAdmin={isAdmin} signOutAction={signOut} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !px-3 !py-1 !text-xs">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-primary !px-4 !py-1 !text-xs">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
