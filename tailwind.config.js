/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-red': 'pulse-red 2s infinite cubic-bezier(0.66, 0, 0, 1)',
        'blink': 'blink 0.7s infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.9' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};