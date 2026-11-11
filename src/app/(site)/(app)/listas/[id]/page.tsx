import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Lock, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { mediaRatings } from "@/lib/data";
import MediaCard from "@/components/MediaCard";
import type { Media } from "@/types";
import { deleteList, removeListItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: list } = await supabase
    .from("lists")
    .select("id, user_id, title, description, is_public, created_at, list_items(position, media(*))")
    .eq("id", id)
    .maybeSingle();
  if (!list) notFound();

  const owner = user?.id === list.user_id;
  const items = ((list.list_items ?? []) as unknown as { position: number; media: Media | null }[])
    .filter((i) => i.media)
    .sort((a, b) => a.position - b.position)
    .map((i) => i.media!);
  const ratings = await mediaRatings(items.map((m) => m.id));

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-8 px-6 py-8">
      <Link href="/listas" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Voltar ao perfil
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-0.5 text-[11px] font-bold uppercase tracking-label text-ink-muted">
            {list.is_public ? <Globe aria-hidden className="size-3" /> : <Lock aria-hidden className="size-3" />}
            {list.is_public ? "Pública" : "Privada"}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">{list.title}</h1>
          {list.description && <p className="text-ink-muted">{list.description}</p>}
          <p className="text-xs text-ink-dim">{items.length} {items.length === 1 ? "item" : "itens"}</p>
        </div>
        {owner && (
          <form action={deleteList}>
            <input type="hidden" name="id" value={list.id} />
            <button className="btn bg-danger-container/40 text-danger hover:bg-danger-container/70">
              <Trash2 aria-hidden className="size-4" /> Excluir lista
            </button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-ink-muted">
          Esta lista ainda não tem obras.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="relative">
              <Link href={`/obras/${m.id}`}>
                <MediaCard media={m} rating={ratings.get(m.id) ?? null} />
              </Link>
              {owner && (
                <form action={removeListItem} className="absolute right-2 top-2">
                  <input type="hidden" name="list_id" value={list.id} />
                  <input type="hidden" name="media_id" value={m.id} />
                  <button aria-label={`Remover ${m.title}`} className="rounded-full bg-bg/80 p-1 text-ink-muted hover:text-danger">
                    <X aria-hidden className="size-3.5" />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
