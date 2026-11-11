"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data";
import { buildQuery } from "@/lib/search";
import { MEDIA_TYPES, PUBLISH_STATUSES } from "@/lib/constants";
import { fetchExternal, SOURCES_BY_TYPE, storageId, type ExternalSource } from "@/lib/external";
import type { MediaType, PublishStatus } from "@/types";

const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const int = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

function mediaFields(formData: FormData) {
  const type = String(formData.get("type")) as MediaType;
  const status = String(formData.get("publish_status")) as PublishStatus;
  const cover = text(formData.get("cover_url"), 500);
  return {
    type: type in MEDIA_TYPES ? type : "anime",
    title: text(formData.get("title"), 200),
    subtitle: text(formData.get("subtitle"), 120) || null,
    synopsis: text(formData.get("synopsis"), 4000) || null,
    cover_url: /^https?:\/\//i.test(cover) ? cover : null,
    release_year: int(formData.get("release_year")),
    total_units: int(formData.get("total_units")),
    genres: text(formData.get("genres"), 300).split(",").map((g) => g.trim()).filter(Boolean).slice(0, 8),
    publish_status: status in PUBLISH_STATUSES ? status : "published",
  };
}

export async function createMedia(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const fields = mediaFields(formData);
  if (!fields.title) return;
  const supabase = await createClient();
  await supabase.from("media").insert({ ...fields, external_source: "manual", created_by: admin.id });
  revalidatePath("/admin", "layout");
  redirect("/admin/catalogo");
}

/**
 * Importa uma obra do AniList/Jikan/TMDB. Recebe só tipo + fonte + id: os dados são buscados
 * no servidor, então o cliente não consegue injetar conteúdo arbitrário.
 * Obras já importadas são ignoradas (não sobrescreve curadoria do admin).
 */
export async function importExternalMedia(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;

  const type = String(formData.get("type")) as MediaType;
  const id = String(formData.get("external_id") ?? "");
  const filter = String(formData.get("tipo") ?? "");
  const back = `/admin/catalogo/importar${buildQuery({ q: String(formData.get("q") ?? ""), tipo: filter === "all" || filter in MEDIA_TYPES ? filter : type })}`;
  const sep = back.includes("?") ? "&" : "?";
  const source = String(formData.get("source")) as ExternalSource;
  if (!(type in MEDIA_TYPES) || !SOURCES_BY_TYPE[type].includes(source)) return;

  let item;
  try {
    item = await fetchExternal(type, id, source);
  } catch {
    redirect(`${back}${sep}erro=api`);
  }
  if (!item) redirect(`${back}${sep}erro=nao-encontrada`);

  const supabase = await createClient();
  const { error } = await supabase.from("media").upsert(
    {
      type: item.type,
      title: item.title.slice(0, 200),
      subtitle: item.subtitle,
      synopsis: item.synopsis?.slice(0, 4000) ?? null,
      cover_url: item.cover_url,
      release_year: item.release_year,
      total_units: item.total_units,
      genres: item.genres,
      publish_status: "published",
      external_source: item.source,
      external_id: storageId(item),
      created_by: admin.id,
    },
    { onConflict: "external_source,external_id", ignoreDuplicates: true },
  );
  if (error) redirect(`${back}${sep}erro=db`);

  revalidatePath("/admin", "layout");
  redirect(`${back}${sep}ok=1`);
}

export async function updateMedia(formData: FormData) {
  if (!(await requireAdmin())) return;
  const fields = mediaFields(formData);
  if (!fields.title) return;
  const supabase = await createClient();
  await supabase.from("media").update(fields).eq("id", String(formData.get("id")));
  revalidatePath("/admin", "layout");
  redirect("/admin/catalogo");
}

export async function deleteMedia(formData: FormData) {
  if (!(await requireAdmin())) return;
  const supabase = await createClient();
  await supabase.from("media").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin", "layout");
}

export async function deleteCampaignReview(formData: FormData) {
  if (!(await requireAdmin())) return;
  const supabase = await createClient();
  await supabase.from("campaign_reviews").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/moderacao");
}

/** Remove só o texto da resenha; a nota do usuário é preservada. */
export async function clearLibraryReview(formData: FormData) {
  if (!(await requireAdmin())) return;
  const supabase = await createClient();
  await supabase.from("library_entries").update({ review: null }).eq("id", String(formData.get("id")));
  revalidatePath("/admin/moderacao");
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const id = String(formData.get("id"));
  if (id === admin.id) return; // evita o admin remover o próprio acesso
  const role = formData.get("role") === "admin" ? "admin" : "user";
  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/usuarios");
}
