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
        background: "#F7F6F2",
        foreground: "#111111",
        primary: "#111111",
        secondary: "#686863",
        muted: "#9B9B94",
        border: "#DDDCD6",
        accent: "#2D5A3D"
      },
    },
  },
  plugins: [],
};
export default config;
