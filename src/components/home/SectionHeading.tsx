const TONES = {
  primary: { text: "text-primary", dot: "bg-primary" },
  secondary: { text: "text-secondary", dot: "bg-secondary" },
  tertiary: { text: "text-tertiary", dot: "bg-tertiary" },
} as const;

export default function SectionHeading({
  eyebrow,
  title,
  tone = "primary",
  children,
}: {
  eyebrow: string;
  title: string;
  tone?: keyof typeof TONES;
  children?: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-sm ${t.dot}`} />
          <span className={`text-[11px] font-bold uppercase tracking-wideLabel ${t.text}`}>
            {eyebrow}
          </span>
        </div>
        <h2 className="text-[32px] font-extrabold leading-10 tracking-[-0.8px]">{title}</h2>
      </div>
      {children}
    </div>
  );
}
