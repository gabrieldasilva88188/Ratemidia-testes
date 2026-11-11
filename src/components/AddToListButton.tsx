"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, Globe, ListPlus, Loader2, Lock, Plus, X } from "lucide-react";
import {
  createListWithMedia,
  getMyListsForMedia,
  setMediaInList,
  type ListOption,
} from "@/lib/actions/lists";

interface Props {
  /** Id da obra no banco. Sem id (catálogo de demonstração) o botão só leva à busca. */
  mediaId: string | null;
  mediaTitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ADD_TO_LIST_DEFAULT_CLASS =
  "inline-flex items-center gap-1 rounded bg-primary px-6 py-2 text-sm font-semibold tracking-[0.14px] text-primary-on shadow-[0_20px_25px_-5px_rgba(208,188,255,0.2)] hover:bg-primary-strong";

export default function AddToListButton({ mediaId, mediaTitle, className, children }: Props) {
  const [open, setOpen] = useState(false);

  const label = children ?? (
    <>
      <Bookmark aria-hidden className="size-3.5 fill-current" />
      Adicionar à Lista
    </>
  );
  const cls = className ?? ADD_TO_LIST_DEFAULT_CLASS;

  if (!mediaId) {
    return (
      <Link href="/busca" className={cls}>
        {label}
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}>
        {label}
      </button>
      {open && <Modal mediaId={mediaId} mediaTitle={mediaTitle} onClose={() => setOpen(false)} />}
    </>
  );
}

function Modal({
  mediaId,
  mediaTitle,
  onClose,
}: {
  mediaId: string;
  mediaTitle?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<ListOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPublic, setNewPublic] = useState(true);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  const goLogin = useCallback(() => {
    const next = window.location.pathname + window.location.search;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }, [router]);

  const load = useCallback(async () => {
    setError(null);
    const res = await getMyListsForMedia(mediaId);
    if (res.status === "login") return goLogin();
    if (res.status === "error") return setError(res.message);
    setLists(res.lists);
    if (res.lists.length === 0) setCreating(true);
  }, [mediaId, goLogin]);

  useEffect(() => {
    setMounted(true);
    void load();
  }, [load]);

  // Esc fecha, foco entra no diálogo e a rolagem da página fica travada.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function toggle(list: ListOption) {
    setBusyId(list.id);
    setError(null);
    startTransition(async () => {
      const res = await setMediaInList(list.id, mediaId, !list.hasMedia);
      setBusyId(null);
      if (res.status === "login") return goLogin();
      if (res.status === "error") return setError(res.message);
      setLists((cur) =>
        (cur ?? []).map((l) =>
          l.id === list.id
            ? { ...l, hasMedia: !l.hasMedia, count: l.count + (l.hasMedia ? -1 : 1) }
            : l,
        ),
      );
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createListWithMedia(newTitle, newPublic, mediaId);
      if (res.status === "login") return goLogin();
      if (res.status === "error") return setError(res.message);
      setNewTitle("");
      setCreating(false);
      await load();
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-list-title"
        tabIndex={-1}
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-line bg-bg-card shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <h2 id="add-to-list-title" className="flex items-center gap-2 text-lg font-bold">
              <ListPlus aria-hidden className="size-5 text-primary" />
              Adicionar à lista
            </h2>
            {mediaTitle && <p className="truncate text-xs text-ink-dim">{mediaTitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded p-1 text-ink-dim hover:bg-surface-high hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        </header>

        <div className="min-h-[96px] flex-1 space-y-3 overflow-y-auto p-5">
          {lists === null && !error && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Carregando suas listas…
            </p>
          )}

          {error && (
            <p role="alert" className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {lists && lists.length > 0 && (
            <ul className="space-y-2">
              {lists.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => toggle(l)}
                    disabled={pending}
                    aria-pressed={l.hasMedia}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                      l.hasMedia
                        ? "border-primary bg-primary/10"
                        : "border-line bg-surface hover:bg-surface-high"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                        l.hasMedia ? "border-primary bg-primary text-primary-on" : "border-line"
                      }`}
                    >
                      {busyId === l.id ? (
                        <Loader2 aria-hidden className="size-3 animate-spin" />
                      ) : (
                        l.hasMedia && <Check aria-hidden className="size-3" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{l.title}</span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-dim">
                        {l.is_public ? (
                          <Globe aria-hidden className="size-3" />
                        ) : (
                          <Lock aria-hidden className="size-3" />
                        )}
                        {l.count} {l.count === 1 ? "obra" : "obras"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {lists && (
            <>
              {!creating ? (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line px-3 py-2.5 text-sm font-semibold text-ink-muted hover:border-primary hover:text-primary"
                >
                  <Plus aria-hidden className="size-4" />
                  Criar nova lista
                </button>
              ) : (
                <form onSubmit={create} className="space-y-2 rounded-lg bg-surface p-3">
                  <label htmlFor="new-list-title" className="text-xs font-medium">
                    Nome da nova lista
                  </label>
                  <input
                    id="new-list-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    maxLength={80}
                    required
                    placeholder='Ex: "Favoritos de 2026"'
                    className="input"
                  />
                  <label className="flex items-center gap-2 text-xs text-ink-dim">
                    <input
                      type="checkbox"
                      checked={newPublic}
                      onChange={(e) => setNewPublic(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Lista pública
                  </label>
                  <div className="flex justify-end gap-2 pt-1">
                    {lists.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="rounded px-3 py-1.5 text-xs font-semibold hover:bg-surface-high"
                      >
                        Cancelar
                      </button>
                    )}
                    <button disabled={pending} className="btn-primary !py-1.5 !text-xs">
                      Criar e adicionar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line p-4">
          <Link href="/listas" className="text-xs font-semibold text-primary hover:underline">
            Gerenciar minhas listas
          </Link>
          <button type="button" onClick={onClose} className="btn-ghost !px-4 !py-1.5 !text-xs">
            Concluir
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
