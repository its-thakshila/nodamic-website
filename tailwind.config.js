/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // New xs band for large phones / phablets (480px).
        // Keeps Tailwind defaults (sm:640, md:768, lg:1024, xl:1280, 2xl:1536) intact.
        // Mirrors BREAKPOINTS.xs in hero.config.js — keep in sync.
        'xs': '480px',
      },
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
  plugins: [
    // Hide scrollbars while preserving scroll behaviour (used by StoriesScreen card row)
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
      })
    },
  ],
}
