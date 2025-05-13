/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-primary-50',
    'bg-primary-100',
    'bg-primary-200',
    'bg-primary-300',
    'bg-primary-400',
    'bg-primary-500',
    'bg-primary-600',
    'bg-primary-700',
    'bg-primary-800',
    'bg-primary-900',
    'text-primary-50',
    'text-primary-100',
    'text-primary-200',
    'text-primary-300',
    'text-primary-400',
    'text-primary-500',
    'text-primary-600',
    'text-primary-700',
    'text-primary-800',
    'text-primary-900',
    'border-primary-50',
    'border-primary-100',
    'border-primary-200',
    'border-primary-300',
    'border-primary-400',
    'border-primary-500',
    'border-primary-600',
    'border-primary-700',
    'border-primary-800',
    'border-primary-900',
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