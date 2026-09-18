/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#121826",
        muted: "#667085",
        line: "#d9e0ea",
        soft: "#eef4ff"
      },
      boxShadow: {
        soft: "0 18px 40px rgba(16, 24, 40, 0.06)"
      }
    }
  },
  plugins: []
};
