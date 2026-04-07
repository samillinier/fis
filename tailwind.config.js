/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0f5e8',
          100: '#e8f0d4',
          200: '#d1e1a9',
          300: '#bad27e',
          400: '#a3c353',
          500: '#89ac44', // Base green color
          600: '#6d8a35',
          700: '#5a6f2b',
          800: '#4a5a24',
          900: '#3a461c',
        },
      },
    },
  },
  plugins: [],
}

