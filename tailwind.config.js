/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addBase, theme }) {
      const forms = require('@tailwindcss/forms');
      forms({ addBase, theme });
    },
  ],
};