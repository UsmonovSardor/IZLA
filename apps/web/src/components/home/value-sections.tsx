import { getTranslations } from 'next-intl/server';
import { Search, CalendarCheck, Sparkles, BadgeCheck, ShieldCheck, Zap, Bot } from 'lucide-react';
import { Reveal } from '@/components/reveal';

/** "Qanday ishlaydi" — 3 bosqich (qidir → bron → bahramand bo'l). */
export async function HowItWorks() {
  const t = await getTranslations('home.how');
  // Brend intizomi: brand → teal progressiyasi (kamalak yo'q — yagona rang oilasi).
  const steps = [
    { icon: Search, k: 'search', grad: 'from-brand to-brand-500' },
    { icon: CalendarCheck, k: 'book', grad: 'from-brand to-teal' },
    { icon: Sparkles, k: 'enjoy', grad: 'from-teal to-teal-600' },
  ];
  return (
    <section className="container-wide py-16">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h2>
          <p className="mt-2 text-muted">{t('sub')}</p>
        </div>
      </Reveal>
      <div className="relative mt-12 grid gap-6 md:grid-cols-3">
        {/* Ulovchi chiziq (desktop) */}
        <div className="pointer-events-none absolute inset-x-[16%] top-9 hidden h-px bg-gradient-to-r from-line via-brand/30 to-line md:block" />
        {steps.map((s, i) => (
          <Reveal key={s.k} delay={i * 90} className="h-full">
            <div className="relative flex h-full flex-col items-center rounded-2xl border border-line bg-surface p-7 text-center shadow-card transition hover:-translate-y-1 hover:shadow-pop">
              <div className={`grid h-[72px] w-[72px] place-items-center rounded-2xl bg-gradient-to-br ${s.grad} text-white shadow-md`}>
                <s.icon size={30} />
              </div>
              <span className="mt-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-bg text-xs font-bold text-muted">{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-bold text-navy">{t(`steps.${s.k}.t`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`steps.${s.k}.d`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** "Nega Izla" — 4 qiymat taklifi. */
export async function WhyIzla() {
  const t = await getTranslations('home.why');
  // Brend intizomi: brand / teal / violet (aksent) — amber olib tashlandi.
  const items = [
    { icon: BadgeCheck, k: 'verified', color: 'text-teal-600', bg: 'bg-teal/[0.08]' },
    { icon: ShieldCheck, k: 'secure', color: 'text-brand', bg: 'bg-brand/[0.07]' },
    { icon: Zap, k: 'fast', color: 'text-brand', bg: 'bg-brand/[0.07]' },
    { icon: Bot, k: 'ai', color: 'text-violet', bg: 'bg-violet/[0.08]' },
  ];
  return (
    <section className="container-wide py-8">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h2>
          <p className="mt-2 text-muted">{t('sub')}</p>
        </div>
      </Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.k} delay={i * 70}>
            <div className="h-full rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-1 hover:shadow-card">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${it.bg} ${it.color}`}>
                <it.icon size={24} />
              </div>
              <h3 className="mt-4 font-display font-bold text-navy">{t(`items.${it.k}.t`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`items.${it.k}.d`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
