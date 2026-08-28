import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Landmark, ArrowRight } from 'lucide-react';
import { formatUZS } from '@/lib/utils';

const ACCENT = '#0F766E';

// tez taxminiy oylik (20% boshlang'ich, 240 oy, ~18% — namunaviy)
function roughMonthly(price: number): number {
  const loan = price * 0.8;
  const r = 18 / 100 / 12;
  const n = 240;
  const pow = Math.pow(1 + r, n);
  return Math.round((loan * r * pow) / (pow - 1));
}

export async function MortgageAttach({ price, propertyId }: { price: number; propertyId?: string }) {
  if (!price || price < 50_000_000) return null;
  const t = await getTranslations('ipoteka');
  const monthly = roughMonthly(price);
  const href = `/ipoteka?price=${Math.round(price)}${propertyId ? `&propertyId=${propertyId}` : ''}`;

  return (
    <Link href={href} className="group mt-4 block overflow-hidden rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5" style={{ borderColor: `${ACCENT}33`, background: `linear-gradient(135deg, ${ACCENT}12, var(--c-surface) 70%)` }}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${ACCENT}1a`, color: ACCENT }}><Landmark className="h-5 w-5" /></span>
        <div>
          <h3 className="font-display text-sm font-bold text-heading">{t('attach.title')}</h3>
          <p className="mt-0.5 text-xs text-muted">{t('attach.text')}</p>
          <p className="mt-1.5 text-sm">
            <span className="font-display text-lg font-extrabold" style={{ color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{formatUZS(monthly)}</span>
            <span className="text-muted"> / {t('calc.perMonth')} {t('card.monthlyFrom').toLowerCase()}</span>
          </p>
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2" style={{ color: ACCENT }}>{t('attach.cta')} <ArrowRight className="h-4 w-4" /></span>
    </Link>
  );
}
