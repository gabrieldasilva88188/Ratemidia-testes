"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import { canManageCampaign, getViewer } from "@/lib/data";
import type { CampaignStatus } from "@/types";

const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

function campaignFields(formData: FormData) {
  const status = String(formData.get("status") ?? "recruiting");
  const cover = text(formData.get("cover_url"), 500);
  return {
    title: text(formData.get("title"), 150),
    synopsis: text(formData.get("synopsis"), 4000),
    system: text(formData.get("system"), 80),
    rules: text(formData.get("rules"), 4000) || null,
    cover_url: /^https?:\/\//i.test(cover) ? cover : null,
    status: (status in CAMPAIGN_STATUSES ? status : "recruiting") as CampaignStatus,
  };
}

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/campanhas/nova");

  const fields = campaignFields(formData);
  if (!fields.title || !fields.system || !fields.synopsis) return;
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ author_id: user.id, ...fields })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/campanhas");
  redirect(`/campanhas/${data.id}`);
}

export async function submitCampaignReview(campaignId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/campanhas/${campaignId}`);

  const rating = Math.min(5, Math.max(0, Number(formData.get("rating") ?? 0)));
  const { error } = await supabase.from("campaign_reviews").upsert(
    {
      campaign_id: campaignId,
      user_id: user.id,
      rating,
      comment: String(formData.get("comment") ?? "").trim() || null,
    },
    { onConflict: "campaign_id,user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/campanhas/${campaignId}`);
}

/** Autor ou admin. Retorna o client Supabase se autorizado, senão null. */
async function authorize(campaignId: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/campanhas/${campaignId}`);
  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("author_id").eq("id", campaignId).maybeSingle();
  if (!data || !canManageCampaign(viewer, data.author_id)) return null;
  return supabase;
}

export async function updateCampaign(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await authorize(id);
  if (!supabase) return;
  const fields = campaignFields(formData);
  if (!fields.title || !fields.system || !fields.synopsis) return;
  const { error } = await supabase.from("campaigns").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${id}`);
  revalidatePath("/admin/campanhas");
  redirect(`/campanhas/${id}`);
}

export async function deleteCampaign(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await authorize(id);
  if (!supabase) return;
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/campanhas");
  revalidatePath("/admin/campanhas");
  // Só destinos conhecidos (evita redirecionamento aberto).
  redirect(formData.get("redirect_to") === "/admin/campanhas" ? "/admin/campanhas" : "/campanhas");
}
