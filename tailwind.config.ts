import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography"; // 👈 importar bien

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        futura: ["var(--font-futura)", "sans-serif"],
        geist: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        oswald: ["var(--font-oswald)", "sans-serif"],
      },
      keyframes: {
        "ping-once": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "float-left": {
          "0%, 100%": {
            transform: "translateY(-50%) rotate(-5deg) translateX(0)",
          },
          "50%": {
            transform: "translateY(-50%) rotate(-5deg) translateX(-5px)",
          },
        },
        "float-right": {
          "0%, 100%": {
            transform: "translateY(-50%) rotate(5deg) translateX(0)",
          },
          "50%": { transform: "translateY(-50%) rotate(5deg) translateX(5px)" },
        },
        // 👇 Añadir estas dos:
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },

      animation: {
        "ping-once": "ping-once 0.4s ease-in-out",
        "float-left": "float-left 3s ease-in-out infinite",
        "float-right": "float-right 3s ease-in-out infinite",
        fadeIn: "fadeIn 0.2s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
      },
    },
  },
  plugins: [typography], // 👈 usar importado arriba
};

export default config;
