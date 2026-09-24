/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        brand: {
          DEFAULT: "#1267F4",
          light: "#EBF3FF",
          dark: "#0E52C6",
          cyan: "#25C7F2",
          accent: "#19B9F2",
        },
        ink: {
          DEFAULT: "#0F172A",
          dark: "#F8FAFC",
        },
        mist: {
          DEFAULT: "#F8FAFC",
          dark: "#020617",
        },
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 10px 25px -3px rgba(15, 23, 42, 0.1)",
        "glow-brand": "0 4px 20px rgba(18, 103, 244, 0.25)",
        "glow-brand-lg": "0 8px 30px rgba(18, 103, 244, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};