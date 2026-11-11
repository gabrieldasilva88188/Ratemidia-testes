import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <form action="/busca" method="get" className="relative w-full max-w-[448px]">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-ink-dim"
      />
      <input
        name="q"
        type="search"
        placeholder="Buscar obras, campanhas, usuários..."
        aria-label="Buscar"
        className="h-[26px] w-full rounded bg-surface-low pl-9 pr-16 text-xs text-ink placeholder:text-ink-dim focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-surface-highest px-1.5 py-0.5 text-[11px] font-bold tracking-label text-ink-muted">
        Ctrl+K
      </kbd>
    </form>
  );
}
