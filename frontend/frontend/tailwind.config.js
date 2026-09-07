/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#C41E24",
        "brand-dark": "#A9191F",
        "brand-light": "#FCE8E9",
        ink: "#17202A",
        mist: "#F5F7FA",
        "mist-dark": "#EEF1F5",
      },
      boxShadow: {
        card: "0 10px 30px rgba(23, 32, 42, 0.06)",
        "card-hover": "0 16px 40px rgba(23, 32, 42, 0.10)",
        "glow-brand": "0 8px 24px rgba(196, 30, 36, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};