import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Car, Plane, Stethoscope, ArrowRight } from 'lucide-react';
import type { InsuranceTypeId } from '@/lib/api';
import { TYPE_ACCENT } from '@/lib/insurance-meta';

/** Kategoriya → mos sug'urta turi (kontekstli attach). */
const MAP: Record<string, { type: InsuranceTypeId; icon: typeof Car; titleKey: string; textKey: string; href: string }> = {
  'avto-xizmat': { type: 'OSAGO', icon: Car, titleKey: 'attach.autoTitle', textKey: 'attach.autoText', href: '/sugurta?type=OSAGO' },
  mehmonxona: { type: 'TRAVEL', icon: Plane, titleKey: 'attach.travelTitle', textKey: 'attach.travelText', href: '/sugurta?type=TRAVEL' },
  klinika: { type: 'HEALTH', icon: Stethoscope, titleKey: 'attach.healthTitle', textKey: 'attach.healthText', href: '/sugurta?type=HEALTH' },
  stomatologiya: { type: 'HEALTH', icon: Stethoscope, titleKey: 'attach.healthTitle', textKey: 'attach.healthText', href: '/sugurta?type=HEALTH' },
};

export async function InsuranceAttach({ categorySlug }: { categorySlug?: string }) {
  if (!categorySlug) return null;
  const cfg = MAP[categorySlug];
  if (!cfg) return null;
  const t = await getTranslations('sugurta');
  const accent = TYPE_ACCENT[cfg.type];
  const Icon = cfg.icon;

  return (
    <Link
      href={cfg.href}
      className="group block overflow-hidden rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5"
      style={{ borderColor: `${accent}33`, background: `linear-gradient(135deg, ${accent}12, var(--c-surface) 70%)` }}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} /> {t('attach.eyebrow')}
      </div>
      <div className="mt-2 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${accent}1a`, color: accent }}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-heading">{t(cfg.titleKey)}</h3>
          <p className="mt-0.5 text-xs text-muted">{t(cfg.textKey)}</p>
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2" style={{ color: accent }}>
        {t('attach.cta')} <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
