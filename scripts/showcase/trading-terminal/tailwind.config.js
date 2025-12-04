/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          green: '#3fb950',
          red: '#f85149',
          blue: '#58a6ff',
          text: '#c9d1d9',
          muted: '#8b949e',
        }
      }
    },
  },
  plugins: [],
}
