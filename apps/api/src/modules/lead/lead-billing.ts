/**
 * CPL (cost-per-lead) hisob qarori — sof funksiya (test qilinadigan o'zak).
 *
 * Prepaid hamyon modeli: balans lead narxidan (CPL) katta yoki teng bo'lsa —
 * lead yetkaziladi va CPL yechiladi; aks holda YETKAZILMAYDI (BLOCKED),
 * balans o'zgarmaydi. Manfiy balans yo'q (qat'iy prepaid gate).
 */
export interface ChargeDecision {
  deliver: boolean; // lead homiyga yetkazilsinmi
  charge: number; // yechiladigan summa (so'm)
  balanceAfter: number; // hisobdan keyingi balans
}

export function decideCharge(balance: number, cpl: number): ChargeDecision {
  const bal = Number.isFinite(balance) ? balance : 0;
  const price = Number.isFinite(cpl) && cpl > 0 ? cpl : 0;
  if (price === 0) return { deliver: true, charge: 0, balanceAfter: bal }; // narxsiz (masalan CPL o'chirilgan)
  if (bal < price) return { deliver: false, charge: 0, balanceAfter: bal }; // balans yetmadi → BLOCKED
  return { deliver: true, charge: price, balanceAfter: bal - price };
}
