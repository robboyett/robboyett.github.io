/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Replace the default sans-serif stack
      },
    },
  },
  plugins: [],
};