/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 24px 80px rgba(15, 23, 42, 0.18)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        fadeUp: "fadeUp 0.5s ease-out both",
        toastIn: "toastIn 0.35s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(-12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0f172a",
        mist: "#e2e8f0",
        accent: "#0f766e",
        danger: "#dc2626",
      },
    },
  },
  plugins: [],
};
