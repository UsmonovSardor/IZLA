/**
 * Nasiya (BNPL) hisoblash — shaffof.
 * total = summa × (1 + ustama(oy)),  oylik = total / oy,  ortiqcha = total − summa.
 * Pul birligi: so'm.
 */
export interface NasiyaQuote {
  months: number;
  amount: number;
  monthlyPayment: number;
  totalPayment: number;
  overpayment: number;
  markupPct: number; // ustama foizi (ko'rsatish uchun)
  available: boolean; // summa provayder chegarasida bo'lsa
}

const round = (n: number) => Math.max(0, Math.round(n));

export function computeNasiya(
  amount: number,
  months: number,
  terms: Record<string, number>,
  limits?: { min?: number | null; max?: number | null },
): NasiyaQuote {
  const a = Math.max(0, amount);
  const key = String(months);
  const markup = typeof terms[key] === 'number' ? terms[key] : 0;
  const total = round(a * (1 + markup));
  const monthly = round(total / Math.max(1, months));
  const available =
    (limits?.min == null || a >= limits.min) && (limits?.max == null || a <= limits.max) && terms[key] != null;
  return {
    months,
    amount: a,
    monthlyPayment: monthly,
    totalPayment: total,
    overpayment: total - a,
    markupPct: Math.round(markup * 1000) / 10,
    available,
  };
}

/** Izla merchant fee (xarid summasidan). */
export function merchantFeeFor(amount: number, rate: number | string): number {
  const r = typeof rate === 'string' ? Number(rate) : rate;
  return round(amount * (isFinite(r) ? r : 0));
}
