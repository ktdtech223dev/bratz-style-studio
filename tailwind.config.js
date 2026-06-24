/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1a1f4a',
        'bg-deep': '#151a3d',
        bg2: '#232a5c',
        card: '#2a3164',
        card2: '#313a73',
        lavender: '#b8a9e8',
        'lav-text': '#a89fd4',
        pink: '#f5a3c7',
        'pink-hot': '#ff6ba8',
        green: '#9be89b',
        green2: '#7dd87d',
        purple: '#c084fc',
        blue: '#7dd3fc',
        yellow: '#fde047',
        cyan: '#67e8f9',
        orange: '#fdba74',
        ink: '#e8e6f5',
        ink2: '#9590b8',
        muted: '#6b6896',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.25)',
        glow: '0 0 24px rgba(184,169,232,0.35)',
        elev1: 'var(--elev-1)',
        elev2: 'var(--elev-2)',
        elev3: 'var(--elev-3)',
        // elevation layered with a top rim highlight — the premium "raised" look
        card: 'var(--elev-2), var(--rim)',
        cardlg: 'var(--elev-3), var(--rim)',
      },
      backgroundImage: {
        'grad-accent': 'var(--grad-accent)',
        'grad-accent-soft': 'var(--grad-accent-soft)',
        'grad-card': 'var(--grad-card)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.22,.61,.36,1)',
      },
    },
  },
  plugins: [],
};
