/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: {
          light: 'var(--color-secondary-light)',
          dark: 'var(--color-secondary-dark)',
        },
      },
    },
  },
  plugins: [],
};