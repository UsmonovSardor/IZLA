import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // TZ brend palitrasi
        brand: { DEFAULT: '#2563EB', 50: '#eff4ff', 100: '#dbe6ff', 500: '#3b6bff', 600: '#2563EB', 700: '#1d4ed8', 900: '#1e3a8a' },
        teal: { DEFAULT: '#14B8A6', 400: '#2dd4bf', 600: '#0d9488' },
        violet: { DEFAULT: '#7C3AED', 400: '#a78bfa' },
        navy: '#0B1F33',
        ink: '#1E293B',
        slate2: '#64748B',
        surface: '#FFFFFF',
        bg: '#F6F8FC',
        line: '#E6EBF2',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: { sm: '10px', md: '14px', lg: '18px', xl: '26px', '2xl': '32px' },
      maxWidth: { screen: '1600px' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
        // Aurora: ko'p-nuqtali radial mesh
        'aurora':
          'radial-gradient(60% 80% at 15% 20%, rgba(37,99,235,.55) 0%, transparent 60%),' +
          'radial-gradient(50% 70% at 85% 15%, rgba(124,58,237,.45) 0%, transparent 55%),' +
          'radial-gradient(60% 90% at 75% 90%, rgba(20,184,166,.5) 0%, transparent 60%),' +
          'linear-gradient(135deg, #0B1F33 0%, #12294a 55%, #0d1b30 100%)',
        'aurora-soft':
          'radial-gradient(50% 60% at 10% 0%, rgba(37,99,235,.12) 0%, transparent 60%),' +
          'radial-gradient(45% 60% at 100% 10%, rgba(20,184,166,.12) 0%, transparent 55%)',
        'glass-sheen': 'linear-gradient(180deg, rgba(255,255,255,.7) 0%, rgba(255,255,255,.35) 100%)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,31,51,.06), 0 10px 30px rgba(15,31,51,.07)',
        pop: '0 16px 50px rgba(15,31,51,.16)',
        glow: '0 10px 40px rgba(37,99,235,.35)',
        'glow-teal': '0 10px 40px rgba(20,184,166,.35)',
        glass: '0 8px 32px rgba(15,31,51,.12), inset 0 1px 0 rgba(255,255,255,.5)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        'aurora-shift': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(3%, -3%, 0) scale(1.08)' },
        },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'aurora-shift': 'aurora-shift 16s ease-in-out infinite',
        'fade-up': 'fade-up .6s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
