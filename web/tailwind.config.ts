import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx,md,mdx}", "./components/**/*.{ts,tsx}", "./content/**/*.{md,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Switzer", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Cabinet Grotesk", "Switzer", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        bg: { base: "#07090d", elev: "#0c0f15" },
        line: { DEFAULT: "rgba(255,255,255,0.07)", strong: "rgba(255,255,255,0.12)" },
        ink: {
          hi: "#ECEDEE",
          mid: "#A1A1AA",
          low: "#71717A",
        },
        brand: {
          DEFAULT: "#6E8BFF",
          soft: "rgba(110,139,255,0.10)",
          line: "rgba(110,139,255,0.35)",
        },
      },
      maxWidth: {
        prose: "70ch",
        page: "1200px",
      },
    },
  },
  plugins: [],
};
export default config;
