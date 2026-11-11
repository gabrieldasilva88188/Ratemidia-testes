import { CAMPAIGN_STATUSES } from "@/lib/constants";
import type { Campaign } from "@/types";

export default function CampaignForm({
  action,
  campaign,
  title,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  campaign?: Campaign;
  title: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <input name="title" required maxLength={150} defaultValue={campaign?.title} placeholder="Título" className="input" />
      <input name="system" required maxLength={80} defaultValue={campaign?.system} placeholder="Sistema (ex: D&D 5e, Tormenta20)" className="input" />
      <textarea name="synopsis" required rows={4} maxLength={4000} defaultValue={campaign?.synopsis} placeholder="Sinopse" className="input" />
      <textarea name="rules" rows={4} maxLength={4000} defaultValue={campaign?.rules ?? ""} placeholder="Regras da casa (opcional)" className="input" />
      <input name="cover_url" type="url" defaultValue={campaign?.cover_url ?? ""} placeholder="URL da capa (opcional, https://…)" className="input" />
      <select name="status" className="input" defaultValue={campaign?.status ?? "recruiting"}>
        {Object.entries(CAMPAIGN_STATUSES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <button className="btn-primary">{submitLabel}</button>
    </form>
  );
}
