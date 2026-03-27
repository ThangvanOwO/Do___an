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
        "on-primary": "#ffffff",
        secondary: "#006c49",
        "secondary-container": "#6cf8bb",
        "on-secondary-container": "#00714d",
        tertiary: "#825100",
        surface: "#f9f9ff",
        "on-surface": "#111c2d",
        "on-surface-variant": "#424754",
        "on-background": "#111c2d",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#e7eeff",
        "surface-container-high": "#dee8ff",
        "surface-container-low": "#f0f3ff",
        "outline-variant": "#c2c6d6",
        outline: "#727785",
        error: "#ba1a1a",
        "inverse-surface": "#263143",
        "inverse-on-surface": "#ecf1ff",
        "secondary-fixed-dim": "#4edea3",
        "background-light": "#f9f9ff",
        "background-dark": "#0f1923",
        background: "#f9f9ff",
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

