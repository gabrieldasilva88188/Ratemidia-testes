import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { campaignRatings } from "@/lib/data";
import CampaignCard from "@/components/CampaignCard";
import type { Campaign } from "@/types";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  let ratings = new Map<string, number | null>();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    campaigns = (data ?? []) as Campaign[];
    ratings = await campaignRatings(campaigns.map((c) => c.id));
  }

  return (
    <div className="container-page space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campanhas de RPG</h1>
        <Link href="/campanhas/nova" className="btn-primary">Nova campanha</Link>
      </div>
      {campaigns.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma campanha cadastrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} rating={ratings.get(c.id) ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
