/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d0010',
        'bg-secondary': '#1a0026',
        'panel-bg': '#2d0040',
        'hot-pink': '#ff2d78',
        'deep-pink': '#c2185b',
        'soft-pink': '#ff69b4',
        'chrome': '#e8e8ff',
        'gold': '#ffd700',
        'purple': '#9c27b0',
        'cyan': '#00e5ff',
        'rarity-common': '#9e9e9e',
        'rarity-rare': '#2196f3',
        'rarity-epic': '#9c27b0',
        'rarity-legendary': '#ffd700',
      },
      fontFamily: {
        display: ['Pacifico', 'cursive'],
        body: ['Nunito', 'sans-serif'],
        digital: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'sparkle': 'sparkle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shake': 'shake 0.3s ease-in-out',
        'bounce-in': 'bounce-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'confetti-fall': 'confetti-fall 1.5s ease-out forwards',
        'coin-float': 'coin-float 0.8s ease-out forwards',
        'rainbow-border': 'rainbow-border 3s linear infinite',
        'hue-rotate': 'hue-rotate-anim 3s linear infinite',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
          '50%': { opacity: 1, transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,45,120,0.5)' },
          '50%': { boxShadow: '0 0 24px rgba(255,45,120,0.9)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: 0 },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(200px) rotate(720deg)', opacity: 0 },
        },
        'coin-float': {
          '0%': { transform: 'translateY(0)', opacity: 1 },
          '100%': { transform: 'translateY(-40px)', opacity: 0 },
        },
        'rainbow-border': {
          '0%': { borderColor: '#ffd700' },
          '25%': { borderColor: '#ff69b4' },
          '50%': { borderColor: '#00e5ff' },
          '75%': { borderColor: '#9c27b0' },
          '100%': { borderColor: '#ffd700' },
        },
        'hue-rotate-anim': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
