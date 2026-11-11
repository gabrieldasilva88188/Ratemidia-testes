"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { USER_STATUSES } from "@/lib/constants";
import type { UserStatus } from "@/types";

// Salva apenas os campos enviados: o painel de status e o formulário de crítica
// usam esta mesma action.
export async function saveEntry(mediaId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/obras/${mediaId}`);

  const patch: Record<string, unknown> = {
    user_id: user.id,
    media_id: mediaId,
    updated_at: new Date().toISOString(),
  };

  if (formData.has("status")) {
    const status = String(formData.get("status")) as UserStatus;
    if (USER_STATUSES.includes(status)) patch.status = status;
  }
  if (formData.has("progress")) {
    patch.progress = Math.max(0, Math.floor(Number(formData.get("progress")) || 0));
  }
  if (formData.has("rating")) {
    // A interface usa nota de 1 a 10; o banco guarda de 0 a 5.
    const r = Number(formData.get("rating"));
    patch.rating = r >= 1 && r <= 10 ? r / 2 : null;
  }
  if (formData.has("review")) {
    patch.review = String(formData.get("review") ?? "").trim() || null;
    patch.has_spoilers = formData.get("spoilers") === "on";
  }

  const { error } = await supabase
    .from("library_entries")
    .upsert(patch, { onConflict: "user_id,media_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/obras/${mediaId}`);
  revalidatePath("/minha-biblioteca");
}
