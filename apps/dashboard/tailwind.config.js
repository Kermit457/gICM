/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gicm: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          dark: "#0f172a",
          card: "#1e293b",
          border: "#334155",
        },
      },
    },
  },
  plugins: [],
};
