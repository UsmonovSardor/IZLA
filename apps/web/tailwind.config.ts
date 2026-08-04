import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // TZ brend palitrasi
        brand: { DEFAULT: '#2563EB', 50: '#eff4ff', 600: '#2563EB', 700: '#1d4ed8' },
        teal: { DEFAULT: '#14B8A6' },
        navy: '#0B1F33',
        ink: '#1E293B',
        slate2: '#64748B',
        surface: '#FFFFFF',
        bg: '#F8FAFC',
        line: '#E2E8F0',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
      backgroundImage: { 'brand-gradient': 'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)' },
      boxShadow: {
        card: '0 1px 3px rgba(15,31,51,.06), 0 8px 24px rgba(15,31,51,.06)',
        pop: '0 12px 40px rgba(15,31,51,.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
