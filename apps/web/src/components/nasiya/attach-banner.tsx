import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { CreditCard, ArrowRight } from 'lucide-react';

const ACCENT = '#7C3AED';

/** Vendor sahifasida — qimmat xizmatlarga "bo'lib to'lash" CTA. */
export async function NasiyaAttach({ amount, vendorId }: { amount: number; vendorId?: string }) {
  if (!amount || amount < 1_000_000) return null; // faqat qimmat xizmatlarga
  const t = await getTranslations('nasiya');
  const href = `/nasiya?amount=${Math.round(amount)}${vendorId ? `` : ''}`;
  return (
    <Link href={href} className="group block overflow-hidden rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5" style={{ borderColor: `${ACCENT}33`, background: `linear-gradient(135deg, ${ACCENT}12, var(--c-surface) 70%)` }}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${ACCENT}1a`, color: ACCENT }}><CreditCard className="h-5 w-5" /></span>
        <div>
          <h3 className="font-display text-sm font-bold text-heading">{t('attach.title')}</h3>
          <p className="mt-0.5 text-xs text-muted">{t('attach.text')}</p>
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2" style={{ color: ACCENT }}>{t('attach.cta')} <ArrowRight className="h-4 w-4" /></span>
    </Link>
  );
}
