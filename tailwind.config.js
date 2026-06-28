/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        ink: {
          base: "#0A0A0F",
          card: "#15151D",
          border: "#26262F",
          hover: "#1E1E28",
        },
        gold: {
          DEFAULT: "#E8B339",
          hover: "#D4A030",
          soft: "rgba(232, 179, 57, 0.15)",
        },
        beam: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
        },
        fg: {
          primary: "#F5F5F7",
          secondary: "#8B8B95",
          muted: "#5C5C66",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        display: ['"Noto Sans SC"', '"IBM Plex Sans"', "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.6)",
        glow: "0 0 20px rgba(232, 179, 57, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
