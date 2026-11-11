import CampaignForm from "@/components/campanha/CampaignForm";
import { createCampaign } from "../actions";

export default function NewCampaignPage() {
  return <CampaignForm action={createCampaign} title="Nova campanha de RPG" submitLabel="Publicar campanha" />;
}
