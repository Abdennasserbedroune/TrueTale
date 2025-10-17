import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e4e9ff",
          200: "#c7ceff",
          300: "#a2acff",
          400: "#7c86ff",
          500: "#5f66fb",
          600: "#453fe5",
          700: "#352fc0",
          800: "#292596",
          900: "#242376",
        },
      },
    },
  },
  plugins: [forms()],
};

export default config;
