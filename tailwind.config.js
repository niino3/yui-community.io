/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf0e5',
          200: '#bce0ce',
          300: '#90c9ad',
          400: '#5fac87',
          500: 'var(--color-primary, #3d7a55)', // CSS変数から動的に取得
          600: '#2e6344',
          700: '#275238',
          800: '#21422e',
          900: '#1c3626',
          DEFAULT: 'var(--color-primary, #3d7a55)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #6b9080)',
        },
        token: {
          50: '#fef9ee',
          100: '#fdf0d3',
          200: '#f9dda6',
          300: '#f5c46d',
          400: '#f0a535',
          500: '#e8893a',
          600: '#d96b2a',
        }
      }
    },
  },
  plugins: [],
}
