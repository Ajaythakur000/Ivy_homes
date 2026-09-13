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
        background: "#0F1115",
        foreground: "#F3F4F6", // warm/crisp off-white
        primary: "#FFFFFF",
        secondary: "#9CA3AF", // muted cool gray
        muted: "#6B7280",
        border: "rgba(255, 255, 255, 0.08)",
        accent: {
          DEFAULT: "#34D399",
          hover: "#6EE7B7",
          dark: "#064E3B",
        },
        surface: {
          DEFAULT: "#1A1D24",
          glass: "rgba(255, 255, 255, 0.03)",
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
