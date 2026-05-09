import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: "#020203", // より漆黒へ
          900: "#08080a",
          800: "#14171F",
        },
        slate: {
          500: "#7D8696",
          400: "#98A2B3",
          300: "#C2CAD8",
        },
        ghost: {
          white: "#F3F4F8",
        },
      },
      // ここに差し込みます
      letterSpacing: {
        "luxury": "0.25em",
        "ultra-wide": "0.5em",
      },
      fontFamily: {
        serif: ["var(--font-display-serif)", "serif"],
        sans: ["var(--font-body-sans)", "sans-serif"],
      },
      boxShadow: {
        glass: "0 20px 60px -20px rgba(0, 0, 0, 0.65)",
      },
      backdropBlur: {
        glass: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
