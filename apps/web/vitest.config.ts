import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Web birlik testlari (vitest). jsdom muhit — React komponentlarini render qilish
 * uchun. JSX esbuild automatic runtime bilan (plugin-react shart emas).
 * `@` → src alias (Next konvensiyasiga mos).
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
