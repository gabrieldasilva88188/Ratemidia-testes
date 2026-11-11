import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BookOpen, Dices, Scroll, Share2, Star, PenLine, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import { average, canManageCampaign, getViewer } from "@/lib/data";
import type { Campaign, CampaignReview } from "@/types";
import { deleteCampaign, submitCampaignReview } from "../actions";

export const dynamic = "force-dynamic";

type CampaignRow = Campaign & { profiles: { username: string; created_at: string } | null };
type ReviewRow = CampaignReview & { profiles: { username: string } | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, profiles(username, created_at)")
    .eq("id", id)
    .single();
  if (!campaign) notFound();
  const c = campaign as CampaignRow;

  const { data: reviewsData } = await supabase
    .from("campaign_reviews")
    .select("*, profiles(username)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });
  const reviews = (reviewsData ?? []) as ReviewRow[];
  const avg = average(reviews.map((r) => Number(r.rating)));
  const recommend = reviews.length
    ? Math.round((reviews.filter((r) => Number(r.rating) >= 4).length / reviews.length) * 100)
    : null;

  const dm = c.profiles?.username ?? "Mestre";
  const canManage = canManageCampaign(await getViewer(), c.author_id);

  return (
    <>
      {/* Hero imersivo */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_60%_0%,rgba(160,120,255,0.28),transparent_55%),radial-gradient(ellipse_at_10%_80%,rgba(147,0,10,0.25),transparent_50%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/70 to-transparent" />

        <div className="mx-auto max-w-[1280px] space-y-6 px-6 pb-8 pt-16 xl:pt-24">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <Link href="/campanhas" className="flex items-center gap-1 text-secondary hover:underline">
              <ArrowLeft aria-hidden className="size-3" />
              Campanhas RPG
            </Link>
            <span className="text-ink-dim">/</span>
            <span className="rounded bg-surface-high px-2 py-0.5 uppercase text-ink-muted">
              Mesa comunitária
            </span>
            <span className="rounded bg-tertiary/20 px-2 py-0.5 uppercase text-tertiary">
              {CAMPAIGN_STATUSES[c.status]}
            </span>
          </nav>

          <div className="grid gap-8 md:grid-cols-[240px_1fr]">
            <div className="relative hidden aspect-[2/3] overflow-hidden rounded-xl bg-surface-high shadow-2xl ring-1 ring-line md:block">
              {c.cover_url ? (
                <Image src={c.cover_url} alt="" fill sizes="240px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(160,120,255,0.5),transparent_60%)]" />
              )}
              <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-bg to-transparent p-4 text-center">
                <Scroll aria-hidden className="mx-auto size-6 text-primary" />
                <p className="text-[11px] font-bold uppercase tracking-label text-ink-muted">
                  Detalhes da campanha RPG
                </p>
                <p className="text-xs text-ink-dim">Sistema: {c.system}</p>
              </div>
            </div>

            <div className="space-y-4 md:pt-24">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1 rounded bg-primary-strong px-3 py-1 font-bold uppercase tracking-label text-primary-on">
                  <BookOpen aria-hidden className="size-3.5" />
                  {c.system}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-[-1.2px] md:text-5xl">
                {c.title}
              </h1>
              <p className="line-clamp-2 max-w-3xl text-lg text-ink-muted">{c.synopsis}</p>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface/80 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary-strong text-lg font-bold text-primary-on">
                    {dm.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      {dm}
                      <span className="flex items-center gap-1 rounded bg-secondary-strong/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-label text-secondary">
                        <BadgeCheck aria-hidden className="size-3" />
                        Mestre
                      </span>
                    </p>
                    <p className="text-xs text-ink-dim">
                      @{dm}
                      {c.profiles?.created_at && (
                        <> • Membro desde {new Date(c.profiles.created_at).getFullYear()}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg bg-surface-low px-4 py-2">
                  <Dices aria-hidden className="size-8 text-tertiary" />
                  <div>
                    <p className="text-3xl font-extrabold leading-8 text-tertiary">
                      {avg !== null ? avg.toFixed(1) : "—"}
                      <span className="text-xs font-normal text-ink-dim"> / 5.0</span>
                    </p>
                    <p className="label text-ink-dim">{reviews.length} avaliações</p>
                  </div>
                  {recommend !== null && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="size-2 rounded-full bg-secondary" />
                      {recommend}% Recomendam
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href="#avaliar" className="btn-primary !px-5 !py-2.5">
                  <PenLine aria-hidden className="size-4" />
                  Avaliar Esta Campanha
                </a>
                <button type="button" aria-label="Compartilhar" className="rounded bg-surface p-2.5 hover:bg-surface-high">
                  <Share2 aria-hidden className="size-4" />
                </button>
                {canManage && (
                  <>
                    <Link href={`/campanhas/${c.id}/editar`} className="btn-ghost border border-line !px-4 !py-2.5">
                      <Pencil aria-hidden className="size-4" />
                      Editar
                    </Link>
                    <form action={deleteCampaign}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn bg-danger-container/40 !px-4 !py-2.5 text-danger hover:bg-danger-container/70">
                        <Trash2 aria-hidden className="size-4" />
                        Excluir
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corpo */}
      <div className="mx-auto grid max-w-[1280px] gap-6 px-6 pb-16 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="space-y-3 rounded-xl bg-surface p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.5px]">Sinopse</h2>
            <p className="whitespace-pre-line leading-7 text-ink-muted">{c.synopsis}</p>
          </section>

          {c.rules && (
            <section className="space-y-3 rounded-xl bg-surface p-6">
              <h2 className="text-2xl font-semibold tracking-[-0.5px]">Regras da mesa</h2>
              <p className="whitespace-pre-line leading-7 text-ink-muted">{c.rules}</p>
            </section>
          )}

          <section id="avaliar" className="scroll-mt-24 space-y-4 rounded-xl bg-surface p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.5px]">Avalie esta campanha</h2>
            <form action={submitCampaignReview.bind(null, id)} className="space-y-3">
              <label className="block text-xs font-medium">
                Nota (0 a 5)
                <input
                  name="rating"
                  type="number"
                  step="0.5"
                  min="0"
                  max="5"
                  required
                  className="input mt-1 w-40"
                />
              </label>
              <textarea name="comment" rows={4} placeholder="Escreva sua resenha..." className="input" />
              <button className="btn-primary">Enviar avaliação</button>
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-[-0.8px]">Resenhas da comunidade</h2>
            {reviews.length === 0 ? (
              <p className="rounded-xl bg-surface p-6 text-sm text-ink-dim">Ainda não há avaliações.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => {
                  const name = r.profiles?.username ?? "usuário";
                  return (
                    <li key={r.id} className="space-y-2 rounded-xl bg-surface p-5">
                      <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-secondary-strong text-xs font-bold text-secondary-on">
                            {name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold">{name}</span>
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-tertiary/15 px-3 py-1 text-xs font-bold text-tertiary">
                          <Star aria-hidden className="size-3 fill-current" />
                          {Number(r.rating).toFixed(1)} / 5
                        </span>
                      </header>
                      {r.comment && <p className="text-sm leading-6 text-ink-muted">{r.comment}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <section className="space-y-2 rounded-xl bg-surface p-5">
            <h3 className="text-xs font-semibold uppercase tracking-label">Ficha da campanha</h3>
            <dl className="divide-y divide-line/60 text-sm">
              {[
                ["Sistema", c.system],
                ["Status", CAMPAIGN_STATUSES[c.status]],
                ["Mestre", dm],
                ["Criada em", new Date(c.created_at).toLocaleDateString("pt-BR")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-ink-dim">{k}:</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
