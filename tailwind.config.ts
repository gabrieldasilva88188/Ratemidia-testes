import type { Config } from "tailwindcss";

// Tokens extraídos do Figma (RateMedia). Os nomes antigos (bg, line, ink, brand,
// accent, danger) foram remapeados para a nova paleta para que telas ainda não
// redesenhadas herdem o visual.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0b0e14", soft: "#191c22", card: "#1d2026" },
        surface: {
          low: "#191c22",
          DEFAULT: "#1d2026",
          high: "#272a31",
          highest: "#32353c",
          bright: "#363940",
        },
        line: "#32353c",
        ink: { DEFAULT: "#e1e2eb", muted: "#cbc3d7", dim: "#958ea0" },
        brand: { DEFAULT: "#d0bcff", dark: "#a078ff", on: "#3c0091" },
        primary: { DEFAULT: "#d0bcff", strong: "#a078ff", on: "#3c0091" },
        secondary: { DEFAULT: "#7bd0ff", strong: "#00a6e0", on: "#00374d" },
        tertiary: { DEFAULT: "#ffb95f", strong: "#ca8100", on: "#472a00" },
        accent: { orange: "#ffb95f", blue: "#7bd0ff", purple: "#d0bcff" },
        danger: { DEFAULT: "#ffb4ab", container: "#93000a", on: "#ffdad6" },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: { card: "0.75rem" },
      letterSpacing: { label: "0.055em", wideLabel: "0.11em" },
    },
  },
  plugins: [],
};

export default config;
