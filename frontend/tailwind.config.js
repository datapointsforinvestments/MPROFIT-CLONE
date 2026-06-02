/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F6F3',
        surface: '#FFFFFF',
        surface2: '#F0EEE9',
        border: '#E2DDD6',
        ink: '#1A1714',
        ink2: '#4A4540',
        ink3: '#8A8480',
        accent: '#1B3A5C',
        'accent-mid': '#2E5F9A',
        'accent-light': '#EBF0F7',
        green: '#1A6B3C',
        'green-bg': '#EAF5EE',
        red: '#9B1C1C',
        'red-bg': '#FEF2F2',
        amber: '#92400E',
        'amber-bg': '#FFFBEB',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
}
