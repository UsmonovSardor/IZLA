/**
 * Ipoteka to'lovi hisoblash — ANNUITET formula (shaffof, senior).
 *
 * Oylik to'lov = K × r × (1+r)^n / ((1+r)^n − 1)
 *   K = kredit summasi, r = oylik stavka (yillik/12/100), n = oylar soni.
 * r = 0 bo'lsa (imtiyozli 0%) → K/n.
 *
 * Natijaga `breakdown` (kredit summasi, oylik, jami, ortiqcha to'lov) qo'shiladi —
 * mijoz aniq summani va ortiqcha to'lovni to'liq ko'radi.
 * Pul birligi: so'm (UZS).
 */

export interface MortgageInput {
  price: number; // obyekt narxi
  termMonths: number; // muddat (oy)
  annualRate: number; // yillik foiz (%)
  downPct?: number; // boshlang'ich to'lov (%) — downAmount ustuvor emas bo'lsa
  downAmount?: number; // yoki aniq summa
}

export interface BreakdownRow {
  label: string;
  value?: number;
  note?: string;
}

export interface MortgageResult {
  price: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number; // oylik × oylar + boshlang'ich
  overpayment: number; // jami foiz (ortiqcha to'lov)
  termMonths: number;
  annualRate: number;
  breakdown: BreakdownRow[];
}

const round = (n: number) => Math.max(0, Math.round(n));
const clampNum = (v: unknown, def: number) => (typeof v === 'number' && isFinite(v) ? v : def);

export function computeMortgage(input: MortgageInput): MortgageResult {
  const price = Math.max(0, clampNum(input.price, 0));
  const termMonths = Math.max(1, Math.round(clampNum(input.termMonths, 240)));
  const annualRate = Math.max(0, clampNum(input.annualRate, 0));

  const down =
    input.downAmount != null
      ? Math.min(price, Math.max(0, clampNum(input.downAmount, 0)))
      : Math.round((price * Math.min(100, Math.max(0, clampNum(input.downPct, 15)))) / 100);

  const loan = Math.max(0, price - down);
  const r = annualRate / 100 / 12;

  let monthly: number;
  if (r === 0) {
    monthly = loan / termMonths;
  } else {
    const pow = Math.pow(1 + r, termMonths);
    monthly = (loan * r * pow) / (pow - 1);
  }
  monthly = round(monthly);

  const totalPayment = round(monthly * termMonths + down);
  const overpayment = round(monthly * termMonths - loan);

  const breakdown: BreakdownRow[] = [
    { label: 'Obyekt narxi', value: price },
    { label: 'Boshlang‘ich to‘lov', value: down, note: price > 0 ? `${Math.round((down / price) * 100)}%` : undefined },
    { label: 'Kredit summasi', value: loan },
    { label: 'Yillik stavka', note: `${annualRate}%` },
    { label: 'Muddat', note: `${termMonths} oy` },
    { label: 'Ortiqcha to‘lov (foiz)', value: overpayment },
  ];

  return { price, downPayment: down, loanAmount: loan, monthlyPayment: monthly, totalPayment, overpayment, termMonths, annualRate, breakdown };
}
