"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Dices, Film, LayoutDashboard, MessageSquareWarning, Users } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/catalogo", label: "Gerenciar Catálogo", icon: Film },
  { href: "/admin/campanhas", label: "Campanhas de RPG", icon: Dices },
  { href: "/admin/moderacao", label: "Moderação de Reviews", icon: MessageSquareWarning },
  { href: "/admin/usuarios", label: "Usuários e Permissões", icon: Users },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administração" className="flex h-full flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              active ? "bg-primary-strong text-primary-on" : "text-ink-muted hover:bg-surface-high hover:text-ink"
            }`}
          >
            <Icon aria-hidden className="size-4" /> {label}
          </Link>
        );
      })}
      <Link href="/" className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-high hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Voltar à Aplicação
      </Link>
    </nav>
  );
}
