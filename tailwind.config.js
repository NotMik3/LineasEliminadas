/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        oxxoRed: '#B51F2A',
        oxxoDark: '#373737',
        oxxoYellow: '#F5A623',
      },
    },
  },
  plugins: [],
};
