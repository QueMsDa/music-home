import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f0f",
        surface: "#1a1a1a",
        card: "#242424",
        accent: "#1db954",
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};

export default config;
