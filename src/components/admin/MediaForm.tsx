import { GENRES, MEDIA_TYPES, PUBLISH_STATUSES } from "@/lib/constants";
import type { Media } from "@/types";

export default function MediaForm({
  action,
  media,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  media?: Media;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-2">
      {media && <input type="hidden" name="id" value={media.id} />}
      <label className="sm:col-span-2 text-sm font-semibold">Título
        <input name="title" required maxLength={200} defaultValue={media?.title} className="input mt-1" />
      </label>
      <label className="text-sm font-semibold">Tipo
        <select name="type" defaultValue={media?.type ?? "anime"} className="input mt-1">
          {Object.entries(MEDIA_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Status editorial
        <select name="publish_status" defaultValue={media?.publish_status ?? "published"} className="input mt-1">
          {Object.entries(PUBLISH_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Subtítulo (estúdio, autor, emissora)
        <input name="subtitle" maxLength={120} defaultValue={media?.subtitle ?? ""} className="input mt-1" />
      </label>
      <label className="text-sm font-semibold">Ano de lançamento
        <input name="release_year" type="number" min={1850} max={2100} defaultValue={media?.release_year ?? ""} className="input mt-1" />
      </label>
      <label className="text-sm font-semibold">Episódios / capítulos
        <input name="total_units" type="number" min={1} defaultValue={media?.total_units ?? ""} className="input mt-1" />
      </label>
      <label className="text-sm font-semibold">URL da capa
        <input name="cover_url" type="url" placeholder="https://…" defaultValue={media?.cover_url ?? ""} className="input mt-1" />
      </label>
      <label className="sm:col-span-2 text-sm font-semibold">Gêneros (separados por vírgula)
        <input name="genres" list="genres-suggestions" defaultValue={(media?.genres ?? []).join(", ")} placeholder="Ação, Isekai" className="input mt-1" />
        <datalist id="genres-suggestions">{GENRES.map((g) => <option key={g} value={g} />)}</datalist>
      </label>
      <label className="sm:col-span-2 text-sm font-semibold">Sinopse
        <textarea name="synopsis" rows={5} maxLength={4000} defaultValue={media?.synopsis ?? ""} className="input mt-1" />
      </label>
      <div className="sm:col-span-2"><button className="btn-primary">{submitLabel}</button></div>
    </form>
  );
}
