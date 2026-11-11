"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ListOption {
  id: string;
  title: string;
  is_public: boolean;
  count: number;
  hasMedia: boolean;
}

export type ListsResult =
  | { status: "ok"; lists: ListOption[] }
  | { status: "login" }
  | { status: "error"; message: string };

export type MutationResult =
  | { status: "ok" }
  | { status: "login" }
  | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Listas do usuário logado, indicando em quais delas a obra já está. */
export async function getMyListsForMedia(mediaId: string): Promise<ListsResult> {
  if (!UUID.test(mediaId)) return { status: "error", message: "Obra inválida." };
  const { supabase, user } = await currentUser();
  if (!user) return { status: "login" };

  const { data: lists, error } = await supabase
    .from("lists")
    .select("id, title, is_public, list_items(media_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return { status: "error", message: "Não foi possível carregar suas listas." };

  return {
    status: "ok",
    lists: (lists ?? []).map((l) => {
      const items = (l.list_items ?? []) as { media_id: string }[];
      return {
        id: l.id as string,
        title: l.title as string,
        is_public: Boolean(l.is_public),
        count: items.length,
        hasMedia: items.some((i) => i.media_id === mediaId),
      };
    }),
  };
}

/** Adiciona (add = true) ou remove (add = false) a obra de uma lista do usuário. */
export async function setMediaInList(
  listId: string,
  mediaId: string,
  add: boolean,
): Promise<MutationResult> {
  if (!UUID.test(listId) || !UUID.test(mediaId)) {
    return { status: "error", message: "Dados inválidos." };
  }
  const { supabase, user } = await currentUser();
  if (!user) return { status: "login" };

  // Confere o dono da lista (além da RLS do banco).
  const { data: list } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!list) return { status: "error", message: "Lista não encontrada." };

  if (add) {
    const { data: last } = await supabase
      .from("list_items")
      .select("position")
      .eq("list_id", listId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("list_items")
      .insert({ list_id: listId, media_id: mediaId, position: (last?.position ?? -1) + 1 });
    // 23505 = já estava na lista: tratado como sucesso.
    if (error && error.code !== "23505") {
      return { status: "error", message: "Não foi possível adicionar à lista." };
    }
  } else {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId)
      .eq("media_id", mediaId);
    if (error) return { status: "error", message: "Não foi possível remover da lista." };
  }

  revalidatePath("/listas");
  revalidatePath(`/listas/${listId}`);
  return { status: "ok" };
}

/** Cria uma lista nova já contendo a obra. */
export async function createListWithMedia(
  title: string,
  isPublic: boolean,
  mediaId: string,
): Promise<MutationResult> {
  const clean = title.trim().slice(0, 80);
  if (!clean) return { status: "error", message: "Dê um nome para a lista." };
  if (!UUID.test(mediaId)) return { status: "error", message: "Obra inválida." };
  const { supabase, user } = await currentUser();
  if (!user) return { status: "login" };

  const { data: created, error } = await supabase
    .from("lists")
    .insert({ user_id: user.id, title: clean, is_public: isPublic })
    .select("id")
    .single();
  if (error || !created) return { status: "error", message: "Não foi possível criar a lista." };

  return setMediaInList(created.id, mediaId, true);
}
