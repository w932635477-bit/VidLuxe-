import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          orange: '#FF6B35',
          gold: '#C9A962',
          cream: '#E8D5B7',
          charcoal: '#2D3436',
          sage: '#9CAF88',
          dusty: '#D4A5A5',
        },
      },
    },
  },
  plugins: [],
};

export default config;
