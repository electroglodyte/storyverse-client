/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light beige/tan theme
        'primary': {
          50: '#f8f5f0',
          100: '#f2eee6',
          200: '#e8e1d9',
          300: '#d6cfc5',
          400: '#c9c0b4',
          500: '#a69886',
          600: '#8a7968',
          700: '#654321',
          800: '#5a3b1e',
          900: '#42301c',
        }
      }
    },
  },
  plugins: [],
}