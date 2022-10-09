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
    fontFamily: {
      Montserrat: ['Montserrat', 'sans-serif'],
    },
    extend: {
      backgroundImage: {
        'main-background': 'linear-gradient(135deg, #34275d 0%, #1b1b1b 100%)',
        'gradient-to-b':
          'linear-gradient(to bottom,rgba(20,20,20,0) 0,rgba(20,20,20,.15) 15%,rgba(20,20,20,.35) 29%,rgba(20,20,20,.58) 44%,#141414 68%,#141414 100%);',
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide'), require('tailwind-scrollbar')],
};
