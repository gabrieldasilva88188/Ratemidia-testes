import Link from "next/link";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import type { Campaign } from "@/types";
import RatingStars from "./RatingStars";

export default function CampaignCard({
  campaign,
  rating = null,
}: {
  campaign: Campaign;
  rating?: number | null;
}) {
  return (
    <Link
      href={`/campanhas/${campaign.id}`}
      className="block space-y-2 rounded-card border border-line bg-bg-card p-4 transition hover:border-accent-purple"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="rounded bg-accent-purple/20 px-2 py-0.5 font-semibold text-accent-purple">
          {campaign.system}
        </span>
        <span className="text-ink-muted">{CAMPAIGN_STATUSES[campaign.status]}</span>
      </div>
      <h3 className="font-semibold">{campaign.title}</h3>
      <p className="line-clamp-3 text-sm text-ink-muted">{campaign.synopsis}</p>
      <RatingStars value={rating} />
    </Link>
  );
}
