/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152033",
        mist: "#f5f7fb",
        line: "#dfe5ee",
        brand: "#176b87",
        accent: "#f1a208"
      },
      boxShadow: {
        panel: "0 16px 44px rgba(21, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};
