/**
 * Kalkulyator forma sxemasi — har sug'urta turi uchun maydonlar ro'yxati.
 * Frontend shu sxema bo'yicha formani renderlaydi va har o'zgarишда backend
 * `/insurance/quote` ni chaqiradi (aniq summa + breakdown serverda hisoblanadi).
 *
 * Faqat KALIT'lar qaytariladi — inson o'qiydigan yorliqlar frontend i18n'da.
 */
import type { InsType } from './pricing';

export interface FormField {
  name: string;
  kind: 'select' | 'number' | 'bool';
  options?: string[]; // select uchun kalitlar
  min?: number;
  max?: number;
  step?: number;
  default: unknown;
}

export const FORM_SCHEMAS: Record<InsType, FormField[]> = {
  OSAGO: [
    { name: 'vehicle', kind: 'select', options: ['car', 'suv', 'truck', 'bus', 'moto'], default: 'car' },
    { name: 'region', kind: 'select', options: ['toshkent_shahar', 'toshkent_viloyat', 'boshqa'], default: 'toshkent_shahar' },
    { name: 'drivers', kind: 'select', options: ['limited', 'unlimited'], default: 'limited' },
    { name: 'experience', kind: 'select', options: ['lt2', 'mid', 'exp'], default: 'exp' },
    { name: 'period', kind: 'select', options: ['12', '6'], default: '12' },
  ],
  KASKO: [
    { name: 'carValue', kind: 'number', min: 30_000_000, max: 3_000_000_000, step: 5_000_000, default: 200_000_000 },
    { name: 'age', kind: 'select', options: ['new', 'mid', 'old'], default: 'mid' },
    { name: 'franchise', kind: 'select', options: ['none', 'low', 'high'], default: 'none' },
  ],
  TRAVEL: [
    { name: 'days', kind: 'number', min: 1, max: 365, step: 1, default: 7 },
    { name: 'coverage', kind: 'select', options: ['30000', '50000', '100000'], default: '30000' },
    { name: 'region', kind: 'select', options: ['cis', 'schengen', 'world'], default: 'schengen' },
    { name: 'age', kind: 'select', options: ['child', 'adult', 'senior'], default: 'adult' },
    { name: 'travelers', kind: 'number', min: 1, max: 10, step: 1, default: 1 },
  ],
  PROPERTY: [
    { name: 'propertyValue', kind: 'number', min: 50_000_000, max: 5_000_000_000, step: 10_000_000, default: 300_000_000 },
    { name: 'kind', kind: 'select', options: ['apartment', 'house', 'dacha'], default: 'apartment' },
  ],
  ACCIDENT: [
    { name: 'insuredSum', kind: 'number', min: 10_000_000, max: 500_000_000, step: 5_000_000, default: 50_000_000 },
    { name: 'occupation', kind: 'select', options: ['office', 'worker', 'extreme'], default: 'office' },
    { name: 'persons', kind: 'number', min: 1, max: 20, step: 1, default: 1 },
  ],
  HEALTH: [
    { name: 'plan', kind: 'select', options: ['standart', 'kengaytirilgan', 'premium'], default: 'standart' },
    { name: 'age', kind: 'select', options: ['young', 'mid', 'senior'], default: 'young' },
    { name: 'dental', kind: 'bool', default: false },
  ],
};

/** Sxemadan default parametrlarni yig'adi. */
export function defaultParams(type: InsType): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of FORM_SCHEMAS[type] ?? []) out[f.name] = f.default;
  return out;
}
