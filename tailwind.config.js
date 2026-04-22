/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1220',
        foreground: '#E5E7EB',
        card: '#111827',
        primary: '#22D3EE',
        secondary: '#8B5CF6',
        muted: '#1F2937',
        border: '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
      keyframes: {
        'recording-pulse': {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(34, 211, 238, 0.7), 0 8px 24px rgba(34, 211, 238, 0.2)' },
          '50%': { 'box-shadow': '0 0 0 20px rgba(34, 211, 238, 0.4), 0 8px 24px rgba(34, 211, 238, 0.15)' },
        },
        'ripple-ring': {
          '0%': { 'transform': 'scale(0.95)', 'opacity': '1' },
          '100%': { 'transform': 'scale(2.5)', 'opacity': '0' },
        },
        'glow-cyan': {
          '0%, 100%': { 'text-shadow': '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.25)' },
          '50%': { 'text-shadow': '0 0 30px rgba(34, 211, 238, 0.8), 0 0 60px rgba(34, 211, 238, 0.4)' },
        },
        'fade-in-up': {
          'from': { 'opacity': '0', 'transform': 'translateY(20px)' },
          'to': { 'opacity': '1', 'transform': 'translateY(0)' },
        },
      },
      animation: {
        'recording-pulse': 'recording-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple-ring 1.5s ease-out infinite',
        'glow-cyan': 'glow-cyan 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
