import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        muted: "#5f6f77",
        line: "#dfe6e8",
        brand: "#0f766e",
        accent: "#b45309",
        wash: "#f6f8f7"
      },
      boxShadow: {
        soft: "0 12px 36px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
