/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#091d2e', 2: '#0d2540', 3: '#112e4a' },
        teal:   { DEFAULT: '#8daba8', lt: '#b8cece', dk: '#5c7f7c', bright: '#4ecdc4' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
