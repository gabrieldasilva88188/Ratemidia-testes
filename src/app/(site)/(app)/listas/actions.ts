"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const url = (v: FormDataEntryValue | null) => {
  const s = text(v, 500);
  return /^https?:\/\//i.test(s) ? s : null;
};

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createList(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  const title = text(formData.get("title"), 80);
  if (!title) return;
  await supabase.from("lists").insert({
    user_id: user.id,
    title,
    description: text(formData.get("description"), 300) || null,
    is_public: formData.get("is_public") === "on",
  });
  revalidatePath("/listas");
}

export async function deleteList(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("lists").delete().eq("id", String(formData.get("id"))).eq("user_id", user.id);
  revalidatePath("/listas");
  redirect("/listas");
}

export async function removeListItem(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  const listId = String(formData.get("list_id"));
  // A RLS já restringe ao dono; o filtro por lista evita remoções em massa.
  await supabase.from("list_items").delete().eq("list_id", listId).eq("media_id", String(formData.get("media_id")));
  revalidatePath(`/listas/${listId}`);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({
      bio: text(formData.get("bio"), 300) || null,
      location: text(formData.get("location"), 80) || null,
      avatar_url: url(formData.get("avatar_url")),
      banner_url: url(formData.get("banner_url")),
    })
    .eq("id", user.id);
  revalidatePath("/listas");
}
