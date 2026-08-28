'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Bookmark, Loader2, ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useSavedJobs } from '@/components/saved-jobs-provider';
import { JobCard } from '@/components/jobs/job-card';
import { api, type SavedJob } from '@/lib/api';

export default function SavedJobsPage() {
  const t = useTranslations('savedJobs');
  const ti = useTranslations('ish');
  const { user, loading, openLogin } = useAuth();
  const { count } = useSavedJobs();
  const [items, setItems] = useState<SavedJob[] | null>(null);

  useEffect(() => {
    if (!user) { setItems(null); return; }
    let alive = true;
    api.savedJobs()
      .then((v) => { if (alive) setItems(v); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
    // count o'zgarsa qayta yuklaymiz (bookmark bosilganda ro'yxat yangilanadi)
  }, [user, count]);

  return (
    <div className="container-wide py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/ish" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-violet-700">
          <ArrowRight size={16} className="rotate-180" /> {ti('backToJobs')}
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <Bookmark className="fill-violet-600" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h1>
            <p className="mt-0.5 text-muted">{t('subtitle')}</p>
          </div>
        </div>

        <div className="mt-8">
          {loading || (user && items === null) ? (
            <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div>
          ) : !user ? (
            <EmptyState icon={<Bookmark size={40} />} title={t('loginTitle')} text={t('loginNeeded')}
              action={<button onClick={() => openLogin()} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">{t('login')}</button>} />
          ) : items && items.length === 0 ? (
            <EmptyState icon={<Compass size={40} />} title={t('emptyTitle')} text={t('emptyText')}
              action={<Link href="/ish" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">{t('browse')} <ArrowRight size={16} /></Link>} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items!.map((job, i) => (
                <motion.div key={job.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <JobCard job={job} index={i} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-bg text-slate-300">{icon}</div>
      <h2 className="mt-5 font-display text-xl font-bold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-muted">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
