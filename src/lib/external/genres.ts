/** Tradução dos gêneros em inglês (MyAnimeList/AniList) para o catálogo em português. */
const GENRE_PT: Record<string, string> = {
  Action: "Ação",
  Adventure: "Aventura",
  "Avant Garde": "Vanguarda",
  "Award Winning": "Premiado",
  Comedy: "Comédia",
  Fantasy: "Fantasia",
  Gourmet: "Gastronomia",
  Horror: "Terror",
  Music: "Música",
  Mystery: "Mistério",
  Psychological: "Psicológico",
  "Sci-Fi": "Ficção Científica",
  "Slice of Life": "Cotidiano",
  Sports: "Esportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspense",
  "Mahou Shoujo": "Garota Mágica",
  Shounen: "Shonen",
  Shoujo: "Shojo",
  "Dark Fantasy": "Fantasia Sombria",
  "Cosmic Horror": "Terror Cósmico",
};

export const translateGenre = (g: string) => GENRE_PT[g] ?? g;
