/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        oxxoRed: '#E30613',
        oxxoDark: '#373737',
        oxxoYellow: '#FBB017',
      },
    },
  },
  plugins: [],
};
