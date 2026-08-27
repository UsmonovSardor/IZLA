'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Loader2, Phone, Send, ShieldCheck } from 'lucide-react';
import {
  type AuthUser,
  type Providers,
  requestOtp,
  verifyOtp,
  getSavedPhone,
  googleLoginUrl,
} from '@/lib/auth';
import { Button } from './ui/button';

const TG_BOT = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'IzlaXizmat_bot';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.35a6.6 6.6 0 0 1 0-4.7V6.81H2.18a11 11 0 0 0 0 9.86l3.66-2.32Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.81l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

/** Qayta ishlatiladigan kirish formasi (telefon+OTP, Google, Telegram). */
export function LoginForm({
  providers,
  onSuccess,
  autoFocus = true,
}: {
  providers: Providers;
  onSuccess: (u: AuthUser) => void;
  autoFocus?: boolean;
}) {
  const t = useTranslations('auth');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [devHint, setDevHint] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhone(getSavedPhone());
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  async function sendOtp() {
    setError('');
    if (!/^\+998\d{9}$/.test(phone)) {
      setError(t('phoneFormat'));
      return;
    }
    setSubmitting(true);
    try {
      const r = await requestOtp(phone);
      setDevHint(r.devHint);
      setResendIn(r.resendAfter ?? 60);
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('sendError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirm() {
    setError('');
    setSubmitting(true);
    try {
      const { user } = await verifyOtp(phone, code);
      onSuccess(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('codeError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-sm text-slate2 hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> {t('back')}
        </button>
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10">
            <ShieldCheck className="h-6 w-6 text-brand" />
          </div>
          <p className="mt-2 text-sm text-slate2">{t('otpSent', { phone })}</p>
        </div>
        <input
          ref={otpRef}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && confirm()}
          placeholder="• • • • • •"
          inputMode="numeric"
          className="w-full rounded-lg border border-line px-3 py-3 text-center text-lg font-mono tracking-[0.4em] outline-none focus:border-brand"
        />
        {devHint && (
          <p className="text-center text-xs text-slate2">
            {t('devMode')} <span className="font-mono font-semibold text-ink">{devHint}</span>
          </p>
        )}
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <Button className="w-full" disabled={submitting || code.length !== 6} onClick={confirm}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirm')}
        </Button>
        <div className="text-center text-xs text-slate2">
          {resendIn > 0 ? (
            <span>{t('resendIn', { sec: resendIn })}</span>
          ) : (
            <button onClick={sendOtp} disabled={submitting} className="font-medium text-brand hover:underline">
              {t('resend')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-slate2">{t('phoneLabel')}</span>
        <div className="mt-1 flex items-center rounded-lg border border-line focus-within:border-brand">
          <Phone className="ml-3 h-4 w-4 text-slate2" />
          <input
            autoFocus={autoFocus}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
            placeholder="+998 XX XXX XX XX"
            inputMode="tel"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none"
          />
        </div>
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" disabled={submitting} onClick={sendOtp}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('getCode')}
      </Button>

      {(providers.google || providers.telegram) && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-center text-[11px] leading-snug text-slate2">
          {t('smsHint')}
        </p>
      )}

      {(providers.google || providers.telegram) && (
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-slate2">{t('or')}</span>
          <div className="h-px flex-1 bg-line" />
        </div>
      )}
      <div className="space-y-2">
        {providers.google && (
          <a
            href={googleLoginUrl()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-bg"
          >
            <GoogleIcon /> {t('google')}
          </a>
        )}
        {providers.telegram && (
          <a
            href={`https://t.me/${TG_BOT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#229ED9] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e8bc0]"
          >
            <Send className="h-4 w-4" /> {t('telegram')}
          </a>
        )}
      </div>
      <p className="text-center text-[11px] text-slate2">{t('terms')}</p>
    </div>
  );
}
