/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        tajawal: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        cairo: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      colors: {
        syria: {
          gold: '#C5A059',
          goldLight: '#E8D19B',
          goldDark: '#8F6E26',
          goldMuted: 'rgba(197, 160, 89, 0.12)',
          navy: '#0B1320',
          dark: '#070C15',
          card: '#111A2C',
          cardHover: '#18253D',
          border: '#22334C',
          borderGold: 'rgba(197, 160, 89, 0.35)',
          green: '#10B981',
          greenDark: '#064E3B',
          red: '#E11D48',
          redDark: '#881337',
        },
        gov: {
          navy: '#0B1320',
          dark: '#070C15',
          card: '#111A2C',
          cardHover: '#18253D',
          border: '#22334C',
          muted: '#94A3B8',
          text: '#F8FAFC',
        },
        tealGov: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        }
      }
    },
  },
  plugins: [],
}
