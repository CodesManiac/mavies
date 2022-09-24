/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      primary: '#34275d',
      dark: '#1b1b1b',
      white: '#ffffff',
      transparent: 'transparent',
    },
    extend: {
      backgroundImage: {
        'main-background': 'linear-gradient(135deg, #34275d 0%, #1b1b1b 100%)',
      },
    },
  },
  plugins: [],
};
