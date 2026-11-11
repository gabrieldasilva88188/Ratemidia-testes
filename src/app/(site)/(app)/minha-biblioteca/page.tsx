import { createClient } from "@/lib/supabase/server";
import { USER_STATUSES, statusLabel } from "@/lib/constants";
import MediaCard from "@/components/MediaCard";
import type { Media, UserStatus } from "@/types";

export const dynamic = "force-dynamic";

type Row = { status: UserStatus; rating: number | null; media: Media | null };

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("library_entries")
    .select("status, rating, media(*)")
    .eq("user_id", user!.id);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="container-page space-y-10">
      <h1 className="text-2xl font-bold">Minha biblioteca</h1>
      {USER_STATUSES.map((status) => {
        const group = rows.filter((r) => r.status === status && r.media);
        return (
          <section key={status} className="space-y-3">
            <h2 className="font-semibold text-ink-muted">
              {statusLabel(status, "anime")} / {statusLabel(status, "manga")} ({group.length})
            </h2>
            {group.length === 0 ? (
              <p className="text-sm text-ink-muted">Vazio por enquanto.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {group.map((r) => (
                  <MediaCard key={r.media!.id} media={r.media!} rating={r.rating} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
