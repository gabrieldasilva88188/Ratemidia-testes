"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookMarked, ChevronDown, LayoutList, LogOut, ShieldCheck } from "lucide-react";

export default function UserMenu({
  username,
  isAdmin,
  signOutAction,
}: {
  username: string;
  isAdmin: boolean;
  signOutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-ink-muted hover:bg-surface-high hover:text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
        className="flex items-center gap-1 rounded-full p-0.5 hover:bg-surface"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-strong text-xs font-bold text-primary-on">
          {username.slice(0, 2).toUpperCase()}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-3 text-ink-dim transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-line bg-bg-card p-1.5 shadow-2xl"
        >
          <div className="border-b border-line px-3 pb-2 pt-1.5">
            <p className="text-[11px] uppercase tracking-label text-ink-dim">Conectado como</p>
            <p className="truncate text-sm font-semibold" title={`@${username}`}>
              @{username}
            </p>
          </div>

          <div className="py-1">
            <Link href="/listas" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <LayoutList aria-hidden className="size-4" />
              Perfil e Minhas Listas
            </Link>
            <Link
              href="/minha-biblioteca"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={item}
            >
              <BookMarked aria-hidden className="size-4" />
              Minha Biblioteca
            </Link>
            {isAdmin && (
              <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={item}>
                <ShieldCheck aria-hidden className="size-4" />
                Painel Admin
              </Link>
            )}
          </div>

          <form action={signOutAction} className="border-t border-line pt-1">
            <button role="menuitem" className={`${item} hover:!text-red-300`}>
              <LogOut aria-hidden className="size-4" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
