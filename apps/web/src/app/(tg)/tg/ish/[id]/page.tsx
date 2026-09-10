'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Briefcase, MapPin, Wifi, BadgeCheck, CheckCircle2, Eye } from 'lucide-react';
import { api, type JobDetail } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/components/auth-provider';
import { TgScreen } from '@/components/tg/tg-screen';
import { Skel, TgButton, Sheet } from '@/components/tg/tg-ui';

export default function TgJobDetail() {
  const t = useTranslations('tg');
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user, openLogin } = useAuth();
  const [j, setJ] = useState<JobDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [applied, setApplied] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [cover, setCover] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.job(id).then(setJ).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    api.jobApplicationStatus(id).then((s) => setApplied(s.applied)).catch(() => {});
  }, [user, id]);

  function openApply() {
    if (!user) { openLogin({ onDone: () => setSheet(true) }); return; }
    setSheet(true);
  }
  async function send() {
    if (!id) return;
    setSending(true);
    setError('');
    try {
      await api.applyJob(id, cover.trim() || undefined);
      haptic.notify('success');
      setApplied(true);
      setSheet(false);
    } catch (e) {
      haptic.notify('error');
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSending(false);
    }
  }

  if (notFound) return <div className="px-6 py-24 text-center text-muted">{t('jobs.notFound')}</div>;
  if (!j) {
    return <div className="space-y-4 p-4"><Skel className="h-8 w-2/3" /><Skel className="h-24 w-full rounded-2xl" /><Skel className="h-40 w-full rounded-2xl" /></div>;
  }

  const salary = j.salaryMin || j.salaryMax
    ? [j.salaryMin && formatUZS(j.salaryMin), j.salaryMax && formatUZS(j.salaryMax)].filter(Boolean).join(' – ')
    : null;

  return (
    <TgScreen title={j.company?.name ?? t('jobs.title')}>
      <div className="pb-24">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand/[0.08] text-brand">
            {j.company?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={j.company.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <Briefcase className="h-6 w-6" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold leading-tight text-navy">{j.title}</h1>
            {j.company && (
              <p className="mt-0.5 flex items-center gap-1 text-[14px] text-muted">
                {j.company.name} {j.company.verified && <BadgeCheck className="h-4 w-4 text-brand" />}
              </p>
            )}
          </div>
        </div>

        {salary && <p className="mt-3 font-display text-lg font-bold text-navy">{salary}</p>}

        <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
          <span className="rounded-full bg-bg px-2.5 py-1 font-semibold text-muted">{t(`jobs.emp.${j.employment}`)}</span>
          <span className="rounded-full bg-bg px-2.5 py-1 font-semibold text-muted">{t(`jobs.exp.${j.experience}`)}</span>
          {j.remote && <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 font-semibold text-teal-600"><Wifi className="h-3 w-3" /> {t('jobs.remote')}</span>}
          {j.region && <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-semibold text-muted"><MapPin className="h-3 w-3" /> {j.region}</span>}
          <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-semibold text-muted"><Eye className="h-3 w-3" /> {t('jobs.views', { n: j.views })}</span>
        </div>

        {j.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {j.skills.map((s) => (
              <span key={s} className="rounded-lg bg-brand/[0.06] px-2.5 py-1 text-[12px] font-semibold text-brand">{s}</span>
            ))}
          </div>
        )}

        {j.description && <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-ink">{j.description}</p>}

        {/* Ariza */}
        <div className="mt-6">
          {applied ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-teal/10 py-3.5 font-semibold text-teal-600">
              <CheckCircle2 className="h-5 w-5" /> {t('jobs.applied')}
            </div>
          ) : (
            <TgButton full size="lg" onClick={openApply}>{t('jobs.apply')}</TgButton>
          )}
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title={t('jobs.apply')}>
        <textarea
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          placeholder={t('jobs.coverPlaceholder')}
          rows={4}
          className="w-full rounded-2xl border border-line bg-bg p-3.5 text-[14px] text-ink outline-none focus:border-brand"
        />
        {error && <p className="mt-2 text-center text-[13px] text-danger">{error}</p>}
        <div className="mt-3">
          <TgButton full size="lg" loading={sending} onClick={send}>{t('common.send')}</TgButton>
        </div>
      </Sheet>
    </TgScreen>
  );
}
