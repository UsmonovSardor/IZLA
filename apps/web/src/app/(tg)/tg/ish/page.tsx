'use client';
import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Briefcase, MapPin, Wifi, BadgeCheck } from 'lucide-react';
import { api, type Job } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { TgScreen } from '@/components/tg/tg-screen';
import { Skel, TgEmpty } from '@/components/tg/tg-ui';

function salaryText(j: Job): string | null {
  if (!j.salaryMin && !j.salaryMax) return null;
  const a = j.salaryMin ? formatUZS(j.salaryMin) : null;
  const b = j.salaryMax ? formatUZS(j.salaryMax) : null;
  if (a && b) return `${a} – ${b}`;
  return (a || b) as string;
}

function JobCard({ j }: { j: Job }) {
  const t = useTranslations('tg.jobs');
  const salary = salaryText(j);
  return (
    <Link
      href={`/tg/ish/${j.id}`}
      onClick={() => haptic.impact('light')}
      className="block rounded-2xl border border-line bg-surface p-4 transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand/[0.08] text-brand">
          {j.company?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={j.company.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Briefcase className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-display text-[15px] font-bold text-navy">{j.title}</p>
          {j.company && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-muted">
              {j.company.name}
              {j.company.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" />}
            </p>
          )}
        </div>
      </div>
      {salary && <p className="mt-2.5 font-display text-[15px] font-bold text-navy">{salary}</p>}
      <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
        <span className="rounded-full bg-bg px-2.5 py-1 font-semibold text-muted">{t(`emp.${j.employment}`)}</span>
        <span className="rounded-full bg-bg px-2.5 py-1 font-semibold text-muted">{t(`exp.${j.experience}`)}</span>
        {j.remote && <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 font-semibold text-teal-600"><Wifi className="h-3 w-3" /> {t('remote')}</span>}
        {j.region && <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-semibold text-muted"><MapPin className="h-3 w-3" /> {j.region}</span>}
      </div>
    </Link>
  );
}

export default function TgJobs() {
  const t = useTranslations('tg');
  const [items, setItems] = useState<Job[] | null>(null);

  useEffect(() => {
    api.jobs().then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  return (
    <TgScreen title={t('jobs.title')}>
      {!items ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skel key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <TgEmpty icon={Briefcase} title={t('jobs.emptyTitle')} sub={t('jobs.emptySub')} />
      ) : (
        <div className="space-y-3">
          {items.map((j) => (
            <JobCard key={j.id} j={j} />
          ))}
        </div>
      )}
    </TgScreen>
  );
}
