import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1F3864",
        accent: "#2E75B6",
        study: "#3B82F6",
        waiting: "#F5C518",
        done: "#22C55E",
        redo: "#F97316",
        help: "#DC2626",
      },
    },
  },
  plugins: [],
};

export default config;
