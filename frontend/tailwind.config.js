/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: '#0f1117',
          card: '#161b27',
          row: '#1e2435',
        },
        border: {
          DEFAULT: '#2a3147',
        },
        accent: {
          purple: '#7c3aed',
          blue: '#3b82f6',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          teal: '#14b8a6',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
