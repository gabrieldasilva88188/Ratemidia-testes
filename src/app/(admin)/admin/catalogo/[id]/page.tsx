import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MediaForm from "@/components/admin/MediaForm";
import type { Media } from "@/types";
import { updateMedia } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Editar obra</h1>
      <MediaForm action={updateMedia} media={data as Media} submitLabel="Salvar alterações" />
    </>
  );
}
