import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, BookOpen, ChevronRight, Heart, Medal, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_TYPES, USER_STATUSES, statusLabel } from "@/lib/constants";
import type { LibraryEntry, Media } from "@/types";
import LibraryControls from "@/components/obra/LibraryControls";
import ReviewForm from "@/components/obra/ReviewForm";
import { saveEntry } from "../actions";

export const dynamic = "force-dynamic";

type ReviewRow = LibraryEntry & { profiles: { username: string } | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: mediaRow } = await supabase.from("media").select("*").eq("id", id).single();
  if (!mediaRow) notFound();
  const media = mediaRow as Media;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("library_entries")
    .select("*, profiles(username)")
    .eq("media_id", id)
    .order("updated_at", { ascending: false });
  const all = (entries ?? []) as ReviewRow[];

  const rated = all.filter((e) => e.rating !== null);
  const avg = rated.length ? rated.reduce((a, e) => a + Number(e.rating), 0) / rated.length : null;
  const reviews = all.filter((e) => e.review);
  const mine = user ? all.find((e) => e.user_id === user.id) : undefined;

  // Distribuição em escala 1–10 (o banco guarda 0–5).
  const buckets = [10, 9, 8, 7, 6].map((n) => {
    const count = rated.filter((e) =>
      n === 6 ? Math.round(Number(e.rating) * 2) <= 6 : Math.round(Number(e.rating) * 2) === n,
    ).length;
    return { label: n === 6 ? "≤ 6" : String(n), count, pct: rated.length ? (count / rated.length) * 100 : 0 };
  });
  const topShare = buckets[0].pct + buckets[1].pct;

  const typeLabel = MEDIA_TYPES[media.type];
  const progressLabel = media.type === "manga" ? "Capítulo" : media.type === "movie" ? "Minutos" : "Progresso";
  const statusOptions = USER_STATUSES.map((s) => ({ value: s, label: statusLabel(s, media.type) }));

  const stats = [
    { icon: Star, tone: "text-tertiary", box: "bg-tertiary/15", value: avg !== null ? (avg).toFixed(2) : "—", suffix: "/ 5", label: `${rated.length} notas` },
    { icon: Medal, tone: "text-primary", box: "bg-primary/15", value: typeLabel, label: "Categoria" },
    { icon: Heart, tone: "text-secondary", box: "bg-secondary/15", value: String(reviews.length), label: "Críticas publicadas" },
    { icon: Users, tone: "text-ink", box: "bg-surface-highest", value: `${all.length}`, label: "Colecionadores" },
  ];

  return (
    <>
      {/* Backdrop cinematográfico */}
      <div className="relative -z-0 h-[320px] overflow-hidden sm:h-[456px]">
        {media.cover_url ? (
          <Image src={media.cover_url} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(160,120,255,0.35),transparent_60%),radial-gradient(ellipse_at_20%_60%,rgba(0,166,224,0.2),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-x-0 top-6">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6">
            <nav aria-label="Trilha" className="flex items-center gap-1 rounded bg-bg/60 px-2 py-1 text-xs font-semibold backdrop-blur-md">
              <Link href={`/busca?tipo=${media.type}`} className="text-ink-muted hover:text-ink">
                {typeLabel}s
              </Link>
              <ChevronRight aria-hidden className="size-3 text-ink-dim" />
              <span className="truncate">{media.title}</span>
            </nav>
            <span className="hidden items-center gap-1 rounded-full bg-surface/70 px-3 py-1 text-[11px] font-bold uppercase tracking-label text-secondary backdrop-blur-md sm:flex">
              <BadgeCheck aria-hidden className="size-3" />
              Catalogado oficialmente
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-[200px] max-w-[1280px] space-y-6 px-6 pb-16 sm:-mt-[320px]">
        {/* Cabeçalho: poster + título + métricas */}
        <header className="flex flex-col gap-6 md:flex-row">
          <div className="relative aspect-[2/3] w-[200px] shrink-0 overflow-hidden rounded-xl bg-surface-high shadow-2xl ring-1 ring-line md:w-[240px]">
            {media.cover_url ? (
              <Image src={media.cover_url} alt={`Capa de ${media.title}`} fill sizes="240px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-dim">Sem capa</div>
            )}
            {media.total_units ? (
              <span className="absolute bottom-2 left-2 rounded bg-secondary-strong px-2 py-0.5 text-[11px] font-bold text-secondary-on">
                {media.total_units} {media.type === "manga" ? "CAPS" : media.type === "movie" ? "MIN" : "EPS"}
              </span>
            ) : null}
          </div>

          <div className="flex-1 space-y-3 md:pt-16">
            <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-label">
              <span className="rounded bg-secondary/15 px-2 py-0.5 text-secondary">{typeLabel}</span>
              {media.release_year && (
                <span className="rounded bg-surface-high px-2 py-0.5">{media.release_year}</span>
              )}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-[-1.2px] md:text-6xl">
              {media.title}
            </h1>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ icon: Icon, tone, box, value, suffix, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg bg-surface p-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${box}`}>
                    <Icon aria-hidden className={`size-5 ${tone}`} />
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-2xl font-bold leading-7 ${tone === "text-ink" ? "" : tone}`}>
                      {value}
                      {suffix && <span className="text-xs font-normal text-ink-dim"> {suffix}</span>}
                    </p>
                    <p className="truncate text-xs text-ink-dim">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Barra de status / progresso */}
        {user ? (
          <LibraryControls
            action={saveEntry.bind(null, id)}
            statusOptions={statusOptions}
            status={mine?.status ?? "planned"}
            progress={mine?.progress ?? 0}
            total={media.total_units}
            progressLabel={progressLabel}
          />
        ) : (
          <div className="rounded-xl bg-surface px-5 py-3 text-sm text-ink-muted">
            <Link href={`/login?next=/obras/${id}`} className="font-semibold text-primary hover:underline">
              Entre
            </Link>{" "}
            para marcar status, acompanhar seu progresso e avaliar esta obra.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="space-y-3 rounded-xl bg-surface p-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.5px]">
                <BookOpen aria-hidden className="size-5 text-primary" />
                Sinopse
              </h2>
              <p className="whitespace-pre-line text-lg leading-8 text-ink-muted">
                {media.synopsis ?? "Nenhuma sinopse cadastrada para esta obra."}
              </p>
            </section>

            {user && (
              <ReviewForm
                action={saveEntry.bind(null, id)}
                rating={mine?.rating != null ? Math.round(Number(mine.rating) * 2) : null}
                review={mine?.review ?? null}
                spoilers={mine?.has_spoilers ?? false}
              />
            )}

            <section className="space-y-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.8px]">Críticas da Comunidade</h2>
                <p className="text-xs text-ink-dim">Análises detalhadas por membros verificados</p>
              </div>
              {reviews.length === 0 ? (
                <p className="rounded-xl bg-surface p-6 text-sm text-ink-dim">
                  Ainda não há críticas. Seja o primeiro a escrever.
                </p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => {
                    const name = r.profiles?.username ?? "usuário";
                    const score = r.rating !== null ? Math.round(Number(r.rating) * 2) : null;
                    return (
                      <li key={r.id} className="space-y-3 rounded-xl bg-surface p-5">
                        <header className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-full bg-primary-strong text-sm font-bold text-primary-on">
                              {name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-semibold">{name}</p>
                              <p className="text-xs text-ink-dim">
                                {new Date(r.updated_at).toLocaleDateString("pt-BR")} •{" "}
                                {statusLabel(r.status, media.type)}
                              </p>
                            </div>
                          </div>
                          {score !== null && (
                            <span className="flex items-center gap-1 rounded-full bg-tertiary/15 px-3 py-1 text-xs font-bold text-tertiary">
                              <Star aria-hidden className="size-3 fill-current" />
                              {score.toFixed(1)} / 10
                            </span>
                          )}
                        </header>
                        {r.has_spoilers ? (
                          <details className="rounded bg-surface-low px-3 py-2 text-sm">
                            <summary className="cursor-pointer text-xs font-semibold text-danger">
                              Este comentário contém spoilers. Mostrar
                            </summary>
                            <p className="mt-2 whitespace-pre-line text-ink-muted">{r.review}</p>
                          </details>
                        ) : (
                          <p className="whitespace-pre-line text-sm leading-6 text-ink-muted">{r.review}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <section className="space-y-3 rounded-xl bg-surface p-5">
              <header className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-label">Distribuição de notas</h3>
                {rated.length > 0 && (
                  <span className="text-xs font-bold text-tertiary">
                    {Math.round(topShare)}% Notas 9 ou 10
                  </span>
                )}
              </header>
              <ul className="space-y-1.5">
                {buckets.map((b) => (
                  <li key={b.label} className="flex items-center gap-2 text-[11px]">
                    <span className="w-6 text-ink-dim">{b.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-low">
                      <div className="h-full rounded-full bg-tertiary" style={{ width: `${b.pct}%` }} />
                    </div>
                    <span className="w-9 text-right font-mono text-ink-dim">{Math.round(b.pct)}%</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2 rounded-xl bg-surface p-5">
              <h3 className="text-xs font-semibold uppercase tracking-label">Ficha técnica</h3>
              <dl className="divide-y divide-line/60 text-sm">
                {[
                  ["Formato", typeLabel],
                  [media.type === "manga" ? "Capítulos" : "Episódios", media.total_units ?? "—"],
                  ["Ano de estreia", media.release_year ?? "—"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between py-2">
                    <dt className="text-ink-dim">{k}:</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
