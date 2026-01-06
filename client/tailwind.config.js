/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Card & Surface Motion
    'cp-card-depth',
    'cp-card-interactive',
    // Button & Control Feedback
    'cp-button-press',
    // Page Enter Motion
    'cp-fade-in',
    'cp-fade-in-delay-1',
    'cp-fade-in-delay-2',
    'cp-fade-in-delay-3',
    'cp-fade-in-delay-4',
    // Scroll Reveal
    'cp-scroll-reveal',
    'cp-revealed',
    // State Transitions
    'cp-state-fade',
    'cp-state-fade-scale',
    'cp-state-hidden',
    'cp-state-scale-down',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      boxShadow: {
        'soft': '0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 50px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};






