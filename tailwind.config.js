/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: '#0d0d0f',
        surface: '#161618',
        card: '#1e1e22',
        border: '#2a2a2f',
        accent: '#e8ff47',
        'accent-dim': '#c5d93a',
        muted: '#6b6b74',
        text: '#f0f0f2',
        'text-dim': '#9898a8',
        red: '#ff4757',
        green: '#2ed573',
        blue: '#3b82f6',
        orange: '#ff6b35',
      },
    },
  },
  plugins: [],
}
