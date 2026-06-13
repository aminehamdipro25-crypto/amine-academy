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
        // ── Brand — Warm Violet (warmer, more child-friendly than cold indigo)
        brand: {
          50:  '#F3EEFF',
          100: '#E8DBFF',
          200: '#D3BBFF',
          300: '#B99AFF',
          400: '#9A7BFD',
          500: '#7C5CFC',
          600: '#6B46F0',
          700: '#5A32D9',
          800: '#4726B8',
          900: '#341A90',
          950: '#1E0F5A',
        },
        // ── Semantic game/therapy domain colors (used consistently everywhere)
        domain: {
          memory:    '#7C5CFC', // purple  — working memory
          attention: '#3B9EFF', // sky     — attention/focus
          impulse:   '#FF6B6B', // coral   — impulse control
          motor:     '#FF8C65', // orange  — motor coordination
          social:    '#2ABFA3', // teal    — social cognition
          learning:  '#FFBA44', // amber   — learning difficulties
        },
        // ── Surface / background system
        surface: {
          page:  '#FFF8F0', // warm cream — page background
          card:  '#FFFFFF', // pure white — card surface
          hover: '#FFF3E8', // soft peach — card hover state
        },
        // ── Accent for CTAs
        accent: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA6C0A',
        },
        // ── Calm palette for secondary elements
        calm: {
          green:    '#10B981',
          teal:     '#2ABFA3',
          sky:      '#3B9EFF',
          lavender: '#B99AFF',
          rose:     '#FF6B6B',
          amber:    '#FFBA44',
        },
        // ── Gamification tiers
        gold:   { 400: '#FBBF24', 500: '#F59E0B' },
        silver: { 400: '#94A3B8', 500: '#64748B' },
        bronze: { 400: '#D97706', 500: '#B45309' },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
      },
      animation: {
        // Existing
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'badge-pop':    'badge-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        // New
        'pop':          'pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-up':     'slide-up 0.3s ease-out',
        'slide-down':   'slide-down 0.25s ease-out',
        'shimmer':      'shimmer 1.8s ease-in-out infinite',
        'wiggle':       'wiggle 0.4s ease-in-out',
        'bounce-soft':  'bounce-soft 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'fade-in':      'fade-in 0.25s ease-out',
        'spin-slow':    'spin 3s linear infinite',
        'star-pop':     'star-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.65' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'badge-pop': {
          '0%':   { transform: 'scale(0) rotate(-10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        pop: {
          '0%':   { transform: 'scale(0.75)', opacity: '0' },
          '70%':  { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(14px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%':      { transform: 'rotate(-4deg)' },
          '60%':      { transform: 'rotate(4deg)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%':      { transform: 'translateY(-8px)' },
          '60%':      { transform: 'translateY(-4px)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'star-pop': {
          '0%':   { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.2) rotate(5deg)',  opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',    opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'brand-sm': '0 2px 8px -2px rgba(124, 92, 252, 0.15)',
        'brand':    '0 8px 24px -4px rgba(124, 92, 252, 0.18)',
        'brand-lg': '0 16px 40px -6px rgba(124, 92, 252, 0.22)',
        'brand-xl': '0 24px 56px -8px rgba(124, 92, 252, 0.28)',
        'warm-sm':  '0 2px 8px -2px rgba(255, 140, 101, 0.15)',
        'warm':     '0 8px 24px -4px rgba(255, 140, 101, 0.18)',
        'card':     '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px -4px rgba(124, 92, 252, 0.16)',
      },
    },
  },
  plugins: [],
}

export default config
