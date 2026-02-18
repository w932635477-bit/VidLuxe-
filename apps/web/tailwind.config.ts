import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // 品牌金色
        brand: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // 评分等级色（与后端对齐）
        grade: {
          s: '#FFD700',  // 顶级 - 金色
          a: '#4CAF50',  // 优秀 - 绿色
          b: '#2196F3',  // 良好 - 蓝色
          c: '#FF9800',  // 普通 - 橙色
          d: '#EF4444',  // 需改进 - 红色
        },
        // 背景色
        dark: {
          bg: '#0a0a0f',
          card: '#14141e',
          elevated: '#1a1a28',
        },
        // 文字色
        content: {
          primary: 'rgba(255, 255, 255, 0.9)',
          secondary: 'rgba(255, 255, 255, 0.6)',
          tertiary: 'rgba(255, 255, 255, 0.4)',
          disabled: 'rgba(255, 255, 255, 0.2)',
        },
        // 高级感风格色
        style: {
          minimal: '#4A90A4',      // 极简 - 冷蓝
          warmLuxury: '#C9A962',   // 暖调奢华 - 金色
          coolPro: '#5B7C99',      // 冷调专业 - 灰蓝
          morandi: '#9CAF88',      // 莫兰迪 - 灰绿
        },
      },
      fontFamily: {
        // 中文优先字体
        display: ['"Noto Serif SC"', '"Bodoni Moda"', 'serif'],
        sans: ['"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'hero': ['clamp(32px, 5vw, 72px)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['clamp(24px, 3vw, 48px)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['clamp(20px, 2.5vw, 32px)', { lineHeight: '1.3' }],
      },
      backgroundImage: {
        // 金色渐变
        'gold-gradient': 'linear-gradient(135deg, #CA8A04, #EAB308)',
        'gold-gradient-hover': 'linear-gradient(135deg, #EAB308, #FDE047)',
        // 深色渐变
        'dark-gradient': 'linear-gradient(180deg, #0f0f18, #0a0a0f)',
        // 玻璃边框渐变
        'glass-border': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.08) 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(202, 138, 4, 0.5)',
        'glow-purple': '0 0 60px rgba(139, 92, 246, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
        'progress': 'progress 30s linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        '3xl': '64px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
