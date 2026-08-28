'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Send, Users, Coins, Loader2, Share2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { api, type ReferralInfo } from '@/lib/api';

export default function ReferralPage() {
  const t = useTranslations('referral');
  const { user, loading, openLogin } = useAuth();
  const { toast } = useToast();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { try { setOrigin(window.location.origin); } catch { /* ignore */ } }, []);

  useEffect(() => {
    if (!user) { setInfo(null); return; }
    let alive = true;
    api.referralMe().then((r) => { if (alive) setInfo(r); }).catch(() => { if (alive) setInfo(null); });
    return () => { alive = false; };
  }, [user]);

  const link = info ? `${origin}/?ref=${info.code}` : '';
  const shareText = t('shareText', { reward: info?.joinReward ?? 50 });

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ variant: 'success', title: t('copied') });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ variant: 'error', title: t('copyError') });
    }
  }

  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="container-wide py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-aurora p-8 text-white shadow-pop md:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-surface/10 blur-2xl" />
          <motion.div initial={{ scale: 0.8, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-surface/15 backdrop-blur">
            <Gift size={28} />
          </motion.div>
          <h1 className="mt-5 font-display text-3xl font-bold md:text-4xl">{t('title')}</h1>
          <p className="mt-2 max-w-md text-white/80">
            {t('subtitle', { referrer: info?.referrerReward ?? 150, join: info?.joinReward ?? 50 })}
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-brand" /></div>
        ) : !user ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface py-14 text-center">
            <Gift className="mx-auto text-slate-300" size={40} />
            <p className="mt-3 text-slate2">{t('loginNeeded')}</p>
            <button onClick={() => openLogin()} className="mt-4 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">{t('login')}</button>
          </div>
        ) : (
          <>
            {/* Statistika */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Stat icon={<Users size={18} />} value={info?.invitedCount ?? 0} label={t('invited')} />
              <Stat icon={<Coins size={18} />} value={info?.coinsEarned ?? 0} label={t('earned')} accent />
            </div>

            {/* Taklif linki */}
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
              <label className="text-sm font-semibold text-navy">{t('yourLink')}</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate rounded-xl border border-line bg-bg px-3.5 py-3 font-mono text-sm text-ink">
                  {info ? link : '…'}
                </div>
                <button onClick={copy} disabled={!info}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50">
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('copiedShort') : t('copy')}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate2">{t('code')}: <span className="font-mono font-bold text-navy">{info?.code ?? '…'}</span></span>
                <a href={tgShare} target="_blank" rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                  <Send size={15} /> {t('shareTelegram')}
                </a>
              </div>
            </div>

            {/* Qanday ishlaydi */}
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
              <h2 className="flex items-center gap-2 font-display font-bold text-navy"><Share2 size={17} className="text-brand" /> {t('howTitle')}</h2>
              <ol className="mt-3 space-y-2.5">
                {[t('step1'), t('step2', { join: info?.joinReward ?? 50 }), t('step3', { referrer: info?.referrerReward ?? 150 })].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-4 text-center text-sm text-slate2">
              <Link href="/profil" className="font-medium text-brand hover:underline">{t('seeCoins')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value, label, accent }: { icon: React.ReactNode; value: number; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-amber-200 bg-amber-50' : 'border-line bg-surface'}`}>
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent ? 'bg-amber-100 text-amber-600' : 'bg-brand-50 text-brand'}`}>{icon}</div>
      <div className="mt-2 font-display text-2xl font-bold text-navy">{value}</div>
      <div className="text-sm text-slate2">{label}</div>
    </div>
  );
}
