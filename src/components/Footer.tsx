import Link from "next/link";
import { Clapperboard } from "lucide-react";

const COLUMNS = [
  {
    title: "Explorar",
    links: [
      ["Lançamentos da Temporada", "/busca"],
      ["Rankings de Anime", "/busca?tipo=anime"],
      ["Mangás em Destaque", "/busca?tipo=manga"],
      ["Sistemas & Fichas RPG", "/campanhas"],
      ["Cinemateca Top 250", "/busca?tipo=movie"],
    ],
  },
  {
    title: "Comunidade",
    links: [
      ["Diretrizes de Review", "#"],
      ["Clubes de Discussão", "#"],
      ["Eventos e Campanhas", "/campanhas"],
      ["Discord Oficial", "#"],
      ["Canal de Novidades", "#"],
    ],
  },
  {
    title: "Institucional",
    links: [
      ["Sobre o RATEMEDIA", "#"],
      ["API Pública de Metadados", "#"],
      ["Termos de Serviço", "#"],
      ["Privacidade de Dados", "#"],
      ["Console de Moderadores", "/admin"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-surface-low">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2 md:pr-6">
            <div className="flex items-center gap-2">
              <Clapperboard aria-hidden className="size-6 text-primary" />
              <span className="text-lg font-extrabold uppercase tracking-[-0.9px]">
                RateMedia
              </span>
            </div>
            <p className="max-w-sm text-xs leading-[18px] text-ink-dim">
              Plataforma definitiva de curadoria, avaliação e catalogação de cultura pop
              contemporânea. Acompanhe lançamentos, descubra campanhas de RPG e compartilhe
              registros com entusiastas.
            </p>
            <div className="flex gap-4 pt-1">
              <Stat label="Títulos catalogados" value="184.920+" />
              <Stat label="Reviews e notas" value="2.4M+" tone="text-secondary" />
              <Stat label="Campanhas RPG" value="14.200+" tone="text-tertiary" />
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="space-y-1">
              <h3 className="pb-1 text-xs font-semibold uppercase tracking-[0.6px]">
                {col.title}
              </h3>
              {col.links.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-xs leading-[18px] text-ink-dim hover:text-ink"
                >
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(73,68,84,0.3)] pt-[17px] text-xs text-ink-dim">
          <p>
            © {new Date().getFullYear()} RATEMEDIA. Todos os direitos reservados. Feito para
            colecionadores e contadores de histórias.
          </p>
          <p className="flex items-center gap-4 text-[11px] font-bold tracking-label">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-secondary" />
              Servidores Operacionais
            </span>
            <span>v0.1.0</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function Stat({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="label text-ink-dim">{label}</p>
      <p className={`text-lg font-bold tracking-[-0.9px] ${tone}`}>{value}</p>
    </div>
  );
}
