import { describe, it, expect } from 'vitest';
import uz from '../messages/uz.json';
import ru from '../messages/ru.json';
import en from '../messages/en.json';

/**
 * i18n PARITY GUARD — uch til (uz/ru/en) bir xil kalitlarga ega bo‘lishi SHART.
 * next-intl yetishmagan kalitda runtime xato beradi → bu test drift'ni CI'da
 * ushlaydi (senior QA himoyasi).
 */
type Json = Record<string, unknown>;

function flatten(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Json, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

const uzKeys = new Set(flatten(uz as Json));
const ruKeys = new Set(flatten(ru as Json));
const enKeys = new Set(flatten(en as Json));

const missing = (base: Set<string>, other: Set<string>) => [...base].filter((k) => !other.has(k));

describe('i18n parity — uz/ru/en teng kalit to‘plami', () => {
  it('ru’da yetishmayotgan (uz’da bor) kalit yo‘q', () => {
    expect(missing(uzKeys, ruKeys)).toEqual([]);
  });
  it('en’da yetishmayotgan (uz’da bor) kalit yo‘q', () => {
    expect(missing(uzKeys, enKeys)).toEqual([]);
  });
  it('uz’da yetishmayotgan (ru’da bor) kalit yo‘q', () => {
    expect(missing(ruKeys, uzKeys)).toEqual([]);
  });
  it('uz’da yetishmayotgan (en’da bor) kalit yo‘q', () => {
    expect(missing(enKeys, uzKeys)).toEqual([]);
  });
  it('uchala tilda kalitlar soni bir xil', () => {
    expect(uzKeys.size).toBe(ruKeys.size);
    expect(ruKeys.size).toBe(enKeys.size);
  });
});
