// Conteúdo de demonstração do Figma. Usado apenas enquanto o banco estiver vazio
// (ou o Supabase não estiver configurado), para a Home refletir o design.

export type PosterCategory = "anime" | "manga" | "series" | "movie" | "rpg";

export interface PosterItem {
  id: string | null; // null => sem página de detalhe (demo)
  title: string;
  category: PosterCategory;
  rating: number | null;
  year?: number | string | null;
  subtitle?: string;
  rank?: string;
  cover?: string | null;
}

export const DEMO_TRENDING: PosterItem[] = [
  { id: null, title: "Chainsaw Man", category: "anime", rating: 4.8, year: 2022, subtitle: "MAPPA", rank: "#2 Rank" },
  { id: null, title: "Arcane: Season 2", category: "series", rating: 4.9, year: 2024, subtitle: "Fortiche", rank: "#1 Série" },
  { id: null, title: "Duna: Parte 2", category: "movie", rating: 4.7, year: 2024, subtitle: "Sci-Fi", rank: "#3 Geral" },
  { id: null, title: "Sousou no Frieren", category: "anime", rating: 4.9, year: 2023, subtitle: "Madhouse", rank: "#1 Anime" },
  { id: null, title: "Berserk (Deluxe)", category: "manga", rating: 4.9, year: null, subtitle: "Dark Horse • Miura", rank: "Top Classic" },
  { id: null, title: "Jujutsu Kaisen: Shibuya", category: "anime", rating: 4.8, year: 2023, subtitle: "MAPPA", rank: "#4 Rank" },
];

export const DEMO_POPULAR: PosterItem[] = [
  { id: null, title: "Dandadan", category: "anime", rating: 4.8, year: 2024, subtitle: "Science SARU" },
  { id: null, title: "Oppenheimer", category: "movie", rating: 4.9, year: 2023, subtitle: "Christopher Nolan" },
  { id: null, title: "Solo Leveling", category: "anime", rating: 4.7, year: 2024, subtitle: "A-1 Pictures" },
  { id: null, title: "Ruptura (Severance)", category: "series", rating: 4.9, year: 2022, subtitle: "Apple TV+" },
  { id: null, title: "Vagabond", category: "manga", rating: 5.0, year: "Clássico", subtitle: "Takehiko Inoue" },
  { id: null, title: "O Urso (The Bear)", category: "series", rating: 4.8, year: 2024, subtitle: "FX / Hulu" },
  { id: null, title: "Bleach: TYBW", category: "anime", rating: 4.8, year: 2024, subtitle: "Studio Pierrot" },
  { id: null, title: "Chamado de Cthulhu", category: "rpg", rating: 4.9, year: "7th Ed", subtitle: "Chaosium" },
];

export interface DemoRpg {
  id: string | null;
  title: string;
  synopsis: string;
  badge: string;
  badgeClass: string;
  system: string;
  rating: number;
  phase: string;
  cadence: string;
  dm: string;
  players: string;
  sessions: string;
  avatars: { letter: string; className: string }[];
  extra: number;
}

export const DEMO_RPG: DemoRpg[] = [
  {
    id: null,
    title: "As Cinzas de Santo Berço: O Retorno",
    synopsis:
      "Um grupo de agentes veteranos é convocado para conter anomalias de Sangue e Morte que voltaram a emergir no vale…",
    badge: "Ordem Paranormal",
    badgeClass: "bg-danger-container/80 text-danger-on",
    system: "D20 System",
    rating: 4.9,
    phase: "Temporada 2 • Ep. 18",
    cadence: "Em Andamento",
    dm: 'Gabriel "Kael"',
    players: "5 / 5 Ativos",
    sessions: "32 Logadas",
    avatars: [
      { letter: "D", className: "bg-primary-strong text-primary-on" },
      { letter: "M", className: "bg-secondary text-[#00354a]" },
      { letter: "L", className: "bg-tertiary text-tertiary-on" },
    ],
    extra: 2,
  },
  {
    id: null,
    title: "A Queda dos Tronos Astrais",
    synopsis:
      "Campanha épica de alto nível desbravando o Mar Astral e confrontando entidades cósmicas antes do colapso do…",
    badge: "D&D 5e • Faerûn",
    badgeClass: "bg-primary-strong/80 text-primary-on",
    system: "D20 System",
    rating: 5.0,
    phase: "Tier 4 • Nível 17",
    cadence: "Semanal",
    dm: "Mariana V.",
    players: "4 / 4 Ativos",
    sessions: "54 Logadas",
    avatars: [
      { letter: "A", className: "bg-secondary-strong text-secondary-on" },
      { letter: "R", className: "bg-primary text-primary-on" },
      { letter: "J", className: "bg-tertiary text-tertiary-on" },
    ],
    extra: 1,
  },
  {
    id: null,
    title: "Coração de Rubelita: Fim dos Deuses",
    synopsis:
      "Incursão às áreas de Tormenta purpurada em busca do artefato que pode restaurar o equilíbrio do Deus da Guerra.",
    badge: "Tormenta20 • Arton",
    badgeClass: "bg-secondary-strong/80 text-secondary-on",
    system: "D20 System",
    rating: 4.8,
    phase: "Guerra Artoniana",
    cadence: "Bi-semanal",
    dm: 'Lucas "Bardo"',
    players: "6 / 6 Ativos",
    sessions: "21 Logadas",
    avatars: [
      { letter: "T", className: "bg-primary text-primary-on" },
      { letter: "E", className: "bg-secondary text-[#00354a]" },
      { letter: "F", className: "bg-tertiary-strong text-tertiary-on" },
    ],
    extra: 3,
  },
];

export const DEMO_FEED = [
  {
    initials: "RN",
    avatar: "bg-primary-strong text-primary-on",
    name: 'Renato "Nox"',
    tag: "Assistiu tudo",
    tagTone: "text-secondary",
    when: "Há 14 minutos",
    title: "Cyberpunk: Edgerunners",
    score: "5.0",
    text: "“A direção da Hiroyuki Imaishi é um espetáculo de ritmo e sensibilidade visual. O final me deixou em frangalhos por três dias seguidos. ‘I Really Want to Stay at Your House’ nunca mais vai soar a mesma.”",
    likes: 142,
    comments: 19,
    note: "Comentou em: Episódio 10 (Final)",
  },
  {
    initials: "AL",
    avatar: "bg-secondary-strong text-secondary-on",
    name: "Aline Lima",
    tag: "Visto no IMAX",
    tagTone: "text-tertiary",
    when: "Há 45 minutos",
    title: "Duna: Parte 2",
    score: "4.5",
    text: "“Denis Villeneuve consolida esta como uma das maiores ficções científicas da história do cinema moderno. O design de som nos vermes da areia faz tremer a alma.”",
    likes: 88,
    comments: 12,
    note: "Revisão sem spoilers",
  },
  {
    initials: "TG",
    avatar: "bg-danger-container text-danger-on",
    name: "Thiago Guimarães",
    tag: "Mesa RPG • Jogador",
    tagTone: "text-primary",
    when: "Há 2 horas",
    title: "Ordem Paranormal: As Cinzas de Santo Berço",
    score: "Nat 20 / 5.0",
    text: "“Sessão 32 foi pura tensão do primeiro ao último minuto. Perdemos um dos NPCs mais queridos do grupo para uma criatura de Morte, mas o roleplay do Gabriel como Mestre foi impecável.”",
    likes: 64,
    comments: 7,
    note: "Mesa privada da guilda",
  },
];

export const DEMO_CURATORS = [
  { rank: 1, initials: "JP", name: "Julio Prado", info: "184 reviews este mês", avatar: "bg-primary-strong text-primary-on", rankTone: "text-secondary" },
  { rank: 2, initials: "CS", name: "Carla Silveira", info: "142 reviews este mês", avatar: "bg-secondary text-[#00354a]", rankTone: "text-tertiary" },
  { rank: 3, initials: "DM", name: "Mestre Alucard", info: "98 sessões mestradas", avatar: "bg-surface-bright text-ink", rankTone: "text-ink-dim" },
];

export const DEMO_LISTS = [
  { title: "“Cyberpunk & Distopias Definitivas do Século XXI”", by: "Por @CyberGhost • 24 títulos", likes: "★ 4.9 (420 curtidas)", tone: "text-secondary" },
  { title: "“Campanhas de RPG com Plot Twists Inesquecíveis”", by: "Por @TavernaDoMago • 16 mesas", likes: "★ 5.0 (310 curtidas)", tone: "text-tertiary" },
  { title: "“Obras com Animação que Desafiam a Física”", by: "Por @SakugaKing • 40 animes", likes: "★ 4.8 (890 curtidas)", tone: "text-primary" },
];
