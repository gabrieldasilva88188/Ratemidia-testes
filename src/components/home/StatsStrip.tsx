import { Clapperboard, Dices, MessageSquareQuote, Users } from "lucide-react";

export interface Stats {
  works: string;
  reviews: string;
  campaigns: string;
  curators: string;
}

export default function StatsStrip({ stats }: { stats: Stats }) {
  const items = [
    { icon: Clapperboard, tone: "text-primary", label: "Obras catalogadas", value: stats.works },
    { icon: MessageSquareQuote, tone: "text-secondary", label: "Reviews registradas", value: stats.reviews },
    { icon: Dices, tone: "text-tertiary", label: "Campanhas RPG vivas", value: stats.campaigns },
    { icon: Users, tone: "text-secondary", label: "Curadores ativos", value: stats.curators },
  ];
  return (
    <section className="bg-surface-low shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-4 px-6 py-4 md:grid-cols-4 xl:px-12">
        {items.map(({ icon: Icon, tone, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-high">
              <Icon aria-hidden className={`size-4 ${tone}`} />
            </span>
            <div>
              <p className="label text-ink-dim">{label}</p>
              <p className="text-lg font-extrabold tracking-[-0.45px]">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
