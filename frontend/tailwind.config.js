/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brandRed: "#9f1d2b",
        brandRedDark: "#6f1320",
        cream: "#fff7ea",
        softPink: "#f7d8dd",
        softBlue: "#dcebf7",
        ink: "#22232a",
        mint: "#dff5e8"
      },
      boxShadow: {
        card: "0 18px 50px rgba(73, 38, 45, 0.12)"
      }
    }
  },
  plugins: []
};
