/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0058be",
        "primary-container": "#2170e4",
        secondary: "#006c49",
        "secondary-container": "#6cf8bb",
        surface: "#f9f9ff",
        "on-surface": "#111c2d",
        "on-background": "#111c2d",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#e7eeff",
        "surface-container-high": "#dee8ff",
        "surface-container-low": "#f0f3ff",
        "outline-variant": "#c2c6d6",
        error: "#ba1a1a",
        "background-light": "#f9f9ff",
        "background-dark": "#0f1923",
      },
      fontFamily: {
        display: ["Be Vietnam Pro", "Inter", "sans-serif"],
        headline: ["Be Vietnam Pro", "Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      borderRadius: { DEFAULT: "1rem", lg: "2rem", xl: "3rem", full: "9999px" },
    },
  },
  plugins: [],
}

