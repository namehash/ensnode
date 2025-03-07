/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
    "./public/**/*.html"
  ],
  safelist: [
    'hidden'
  ],
  theme: {
    extend: {
      colors: {
        'pg-blue': '#336791',
        'pg-light': '#e7eaee',
      },
    },
  },
  plugins: [],
}
