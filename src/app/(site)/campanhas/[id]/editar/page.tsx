import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageCampaign, getViewer } from "@/lib/data";
import CampaignForm from "@/components/campanha/CampaignForm";
import type { Campaign } from "@/types";
import { updateCampaign } from "../../actions";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/campanhas/${id}/editar`);

  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (!data || !canManageCampaign(viewer, data.author_id)) notFound();

  return (
    <div className="container-page">
      <CampaignForm action={updateCampaign} campaign={data as Campaign} title="Editar campanha" submitLabel="Salvar alterações" />
    </div>
  );
}
