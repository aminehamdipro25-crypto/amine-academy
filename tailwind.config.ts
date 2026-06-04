import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sensory-friendly palette — calm, non-stimulating for ADHD/Autism
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d6fe',
          300: '#a4b9fc',
          400: '#7a94f8',
          500: '#5b6ef2',  // primary
          600: '#4650e3',
          700: '#3840c8',
          800: '#3037a2',
          900: '#2c3280',
          950: '#1c1f52',
        },
        calm: {
          green: '#4ade80',
          teal:  '#2dd4bf',
          sky:   '#38bdf8',
          lavender: '#c4b5fd',
          rose:  '#fb7185',
          amber: '#fbbf24',
        },
        // Gamification colors
        gold:    { 400: '#fbbf24', 500: '#f59e0b' },
        silver:  { 400: '#94a3b8', 500: '#64748b' },
        bronze:  { 400: '#d97706', 500: '#b45309' },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'badge-pop':    'badge-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'badge-pop': {
          '0%':   { transform: 'scale(0) rotate(-10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
