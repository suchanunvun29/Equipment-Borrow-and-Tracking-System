import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C2410C",
          dark: "#9A3412",
          light: "#EA580C",
        },
        accent: "#F59E0B",
        surface: "#FFF7ED",
        sidebar: "#7C2D12",
      },
    },
  },
  plugins: [],
} satisfies Config;
