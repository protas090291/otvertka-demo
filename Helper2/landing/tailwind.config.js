/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#3b82f6',
          purple: '#764ba2',
          slate: {
            bg: '#1e293b',
            card: 'rgba(255,255,255,0.95)',
          },
        },
      },
    },
  },
  plugins: [],
};
