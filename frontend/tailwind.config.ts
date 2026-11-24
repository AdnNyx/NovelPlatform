import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
        },
        secondary: {
          DEFAULT: "#D97706",
        },
        "surface-light": "#FAFAFA",
        "card-light": "#FFFFFF",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        "border-subtle": "#E5E7EB",
        // Status Badge Palette
        badge: {
          ongoing: {
            bg: "#ECFDF5",
            text: "#047857",
          },
          tamat: {
            bg: "#FFFBEB",
            text: "#B45309",
          },
          draft: {
            bg: "#F3F4F6",
            text: "#374151",
          },
        },
        // Reader Mode Exclusive Theme Tokens
        reader: {
          light: {
            bg: "#FFFFFF",
            text: "#1F2937",
          },
          sepia: {
            bg: "#F4ECD8",
            text: "#433422",
          },
          dark: {
            bg: "#121214",
            text: "#D4D4D8",
          },
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        "reader-serif": ["Lora", "Merriweather", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        badge: "9999px",
      },
      maxWidth: {
        "reader-col": "68ch", // Optimal column measure (~720px) from DESIGN.md
      },
      aspectRatio: {
        "2/3": "2 / 3",
      },
    },
  },
  plugins: [],
};

export default config;
