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
        'primary-dark': '#121212', // A deep dark background
        'accent-blue': '#4F46E5', // A strong blue for buttons
        'accent-green': '#10B981', // A nice green accent
      },
    },
  },
  plugins: [],
}
