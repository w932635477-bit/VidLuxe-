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
        // Apple 风格品牌金色 - 香槟金
        brand: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#E5C04B',
          500: '#D4AF37',
          600: '#B8962E',
          700: '#9A7D26',
          800: '#7C641E',
          900: '#5E4B16',
        },
        // 评分等级色 - Apple 风格
        grade: {
          s: '#FFD700',
          a: '#34C759',
          b: '#007AFF',
          c: '#FF9500',
          d: '#FF3B30',
        },
        // 背景色 - 纯黑系
        dark: {
          bg: '#000000',
          secondary: '#0a0a0a',
          card: 'rgba(255, 255, 255, 0.03)',
          elevated: '#1c1c1e',
        },
        // 文字色 - Apple 灰阶
        content: {
          primary: 'rgba(255, 255, 255, 0.95)',
          secondary: 'rgba(255, 255, 255, 0.6)',
          tertiary: 'rgba(255, 255, 255, 0.45)',
          muted: 'rgba(255, 255, 255, 0.3)',
          disabled: 'rgba(255, 255, 255, 0.15)',
        },
        // 高级感风格色 - Apple 风格
        style: {
          minimal: '#8E8E93',
          warmLuxury: '#D4AF37',
          coolPro: '#5E6C84',
          morandi: '#9CAF88',
        },
      },
      fontFamily: {
        // Premium Typography System
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        display: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'hero': ['clamp(48px, 8vw, 88px)', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '600' }],
        'h1': ['clamp(32px, 5vw, 56px)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'h2': ['clamp(24px, 4vw, 40px)', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '500' }],
        'h3': ['clamp(18px, 2.5vw, 24px)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '500' }],
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
