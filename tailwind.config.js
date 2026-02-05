/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#181818',
        surfaceHighlight: '#282828',
        primary: '#1DB954', // Spotify Green
        primaryDark: '#1aa34a',
        accent: '#9b4de0', // Purple accent
        error: '#e91429',
        textBase: '#FFFFFF',
        textSubdued: '#B3B3B3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
