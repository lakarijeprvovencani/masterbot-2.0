/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at center, rgba(255,255,255,0.1), transparent 40%)',
        'hero-gradient': 'radial-gradient(ellipse at 70% 40%, #8A2BE2, transparent 70%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],
};
