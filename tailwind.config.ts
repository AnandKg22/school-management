import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: "#001f3f",
          light: "#003366",
          accent: "#0074D9",
          hover: "#004080",
          card: "#002852",
        },
        status: {
          success: "#34a853",
          warning: "#fbbc04",
          danger: "#ea4335",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
