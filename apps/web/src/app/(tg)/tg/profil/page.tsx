'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Coins, Gift, Heart, LogOut, Check, Share2, ChevronRight } from 'lucide-react';
import { api, type ReferralInfo, type Vendor } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { LOCALE_COOKIE, localeNames, locales, localeShort, type Locale } from '@/i18n/config';
import { haptic, openLink } from '@/lib/telegram';
import { TgScreen, TgSection } from '@/components/tg/tg-screen';
import { TgAuthGate } from '@/components/tg/tg-auth-gate';
import { TgVendorCard } from '@/components/tg/tg-vendor-card';
import { TgCard, TgButton, Skel } from '@/components/tg/tg-ui';

function ProfileInner() {
  const t = useTranslations('tg');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [favorites, setFavorites] = useState<Vendor[] | null>(null);

  useEffect(() => {
    api.referralMe().then(setReferral).catch(() => setReferral(null));
    api.favorites(locale).then(setFavorites).catch(() => setFavorites([]));
  }, [locale]);

  if (!user) return null;
  const initial = (user.name || 'U').trim().charAt(0).toUpperCase();

  function chooseLang(l: Locale) {
    if (l === locale) return;
    haptic.select();
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  function share() {
    if (!referral) return;
    haptic.impact('medium');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://izla.uz';
    const link = `${origin}/tg?ref=${referral.code}`;
    openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t('profile.shareText'))}`);
  }

  return (
    <>
      {/* Foydalanuvchi karta */}
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-gradient-to-br from-brand/[0.06] to-teal/[0.06] p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-2xl font-bold text-white">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name ?? ''} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-navy">{user.name || t('anonUser')}</p>
          {user.phone && <p className="truncate text-[13px] text-muted">{user.phone}</p>}
          <span className="mt-1 inline-block rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
            {t(`profile.via.${user.provider}`)}
          </span>
        </div>
      </div>

      {/* Tanga + referal */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <TgCard className="p-4">
          <Coins className="h-6 w-6 text-amber-500" />
          <p className="mt-2 font-display text-2xl font-bold text-navy">{user.coins ?? 0}</p>
          <p className="text-[12px] text-muted">{t('profile.coins')}</p>
        </TgCard>
        <TgCard className="p-4">
          <Gift className="h-6 w-6 text-violet" />
          <p className="mt-2 font-display text-2xl font-bold text-navy">{referral?.invitedCount ?? 0}</p>
          <p className="text-[12px] text-muted">{t('profile.invited')}</p>
        </TgCard>
      </div>

      {/* Referal ulashish */}
      {referral && (
        <TgCard className="mt-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-muted">{t('profile.yourCode')}</p>
              <p className="font-display text-lg font-bold tracking-wider text-brand">{referral.code}</p>
            </div>
            <TgButton size="sm" onClick={share}>
              <Share2 className="h-4 w-4" /> {t('profile.share')}
            </TgButton>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            {t('profile.referHint', { reward: referral.joinReward })}
          </p>
        </TgCard>
      )}

      {/* Sevimlilar */}
      <TgSection
        title={t('profile.favorites')}
        action={
          favorites && favorites.length > 0 ? (
            <span className="text-[13px] font-semibold text-muted">{favorites.length}</span>
          ) : undefined
        }
      >
        {!favorites ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skel key={i} className="h-[164px] w-[220px] shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-5 text-[13px] text-muted">
            <Heart className="h-5 w-5 text-muted" /> {t('profile.noFavorites')}
          </div>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 tg-noscroll">
            {favorites.map((v) => (
              <TgVendorCard key={v.id} v={v} variant="rail" />
            ))}
          </div>
        )}
      </TgSection>

      {/* Til */}
      <TgSection title={t('profile.language')}>
        <TgCard className="divide-y divide-line overflow-hidden">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => chooseLang(l)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-bg"
            >
              <span className={`grid h-7 w-9 shrink-0 place-items-center rounded-md text-[11px] font-bold ${l === locale ? 'bg-brand text-white' : 'bg-bg text-muted'}`}>
                {localeShort[l]}
              </span>
              <span className="flex-1 text-[15px] font-medium text-ink">{localeNames[l]}</span>
              {l === locale && <Check className="h-5 w-5 text-brand" />}
            </button>
          ))}
        </TgCard>
      </TgSection>

      {/* Chiqish */}
      <div className="mt-6">
        <TgButton
          variant="ghost"
          full
          onClick={() => {
            haptic.impact('medium');
            void signOut();
          }}
          className="text-danger"
        >
          <LogOut className="h-4 w-4" /> {t('profile.logout')}
        </TgButton>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-center text-[12px] text-muted">
        Izla.uz <ChevronRight className="h-3 w-3" /> Mini App
      </p>
    </>
  );
}

export default function TgProfile() {
  const t = useTranslations('tg');
  return (
    <TgScreen large title={t('tabs.profile')}>
      <TgAuthGate>
        <ProfileInner />
      </TgAuthGate>
    </TgScreen>
  );
}
