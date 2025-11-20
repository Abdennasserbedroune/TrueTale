import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, professional palette with off-whites, soft grays, and gentle accent
        brand: {
          50: "#f0f5f9",
          100: "#dce7f0",
          200: "#b8d0e1",
          300: "#8db2cf",
          400: "#6391ba",
          500: "#4a7ba7",
          600: "#3a628b",
          700: "#2f4f71",
          800: "#2a435f",
          900: "#273a51",
        },
        bg: {
          primary: "#fafbfc",
          secondary: "#f5f7f9",
          tertiary: "#eef1f4",
        },
        surface: {
          DEFAULT: "#ffffff",
          elevated: "#ffffff",
          overlay: "rgba(255, 255, 255, 0.95)",
        },
        text: {
          primary: "#1f2937",
          secondary: "#4b5563",
          tertiary: "#6b7280",
          inverse: "#ffffff",
        },
        muted: {
          DEFAULT: "#9ca3af",
          light: "#d1d5db",
          dark: "#6b7280",
        },
        border: {
          DEFAULT: "#e5e7eb",
          light: "#f3f4f6",
          medium: "#d1d5db",
          dark: "#9ca3af",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "6.5": "1.625rem",
        "7.5": "1.875rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.75rem" }],
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
