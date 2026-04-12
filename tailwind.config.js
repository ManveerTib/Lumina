/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
<<<<<<< HEAD
  darkMode: 'class',
=======
>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#091d2e', 2: '#0d2540', 3: '#112e4a' },
        teal:   { DEFAULT: '#8daba8', lt: '#b8cece', dk: '#5c7f7c', bright: '#4ecdc4' },
<<<<<<< HEAD
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        border: 'var(--border)',
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)', 600: '#4ecdc4', 500: '#5ecfcc' },
=======
>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
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
