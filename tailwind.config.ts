import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E31E24",
          darkred: "#B71820",
          light: "#FEF2F2",
          gray: "#F8F8F8",
        },
      },
      fontFamily: {
        sans: ["Inter", "Sarabun", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
