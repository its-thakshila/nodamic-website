/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        border: '#2a2a2a',
        accent: '#ffffff',
        muted: '#6b6b6b',
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      }
    },
  },
  plugins: [],
}
