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
          DEFAULT: "#1B4F8A",
          dark: "#143d6e",
          light: "#2563a8",
        },
        gold: {
          DEFAULT: "#F5A623",
          light: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};

export default config;
