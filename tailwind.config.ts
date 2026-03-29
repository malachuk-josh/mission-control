import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Terminal dark palette
        bg: {
          base: '#090c10',
          surface: '#0d1117',
          elevated: '#161b22',
          hover: '#1c2128',
          border: '#21262d',
        },
        neon: {
          green: '#39d353',
          cyan: '#58a6ff',
          yellow: '#f0c060',
          red: '#f85149',
          purple: '#bc8cff',
          orange: '#e8812a',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#484f58',
          inverse: '#0d1117',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'scan': 'scan 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'type': 'type 2s steps(40, end)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        glow: {
          '0%': { textShadow: '0 0 4px currentColor' },
          '100%': { textShadow: '0 0 12px currentColor, 0 0 20px currentColor' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        type: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 8px #39d353, 0 0 16px rgba(57, 211, 83, 0.3)',
        'neon-cyan': '0 0 8px #58a6ff, 0 0 16px rgba(88, 166, 255, 0.3)',
        'neon-red': '0 0 8px #f85149, 0 0 16px rgba(248, 81, 73, 0.3)',
        'neon-yellow': '0 0 8px #f0c060, 0 0 16px rgba(240, 192, 96, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
