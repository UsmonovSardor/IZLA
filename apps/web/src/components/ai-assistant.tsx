'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, X, ArrowRight, Star, Send, Loader2 } from 'lucide-react';
import { api, type AssistantReply, type Vendor } from '@/lib/api';

type Msg = { role: 'user' | 'assistant'; content: string; vendors?: Vendor[]; searchUrl?: string | null };

export function AiAssistant() {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.assistantStatus().then((s) => setEnabled(s.enabled)).catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy, open]);

  const suggestions = [t('sug1'), t('sug2'), t('sug3')];

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const history = next.map((m) => ({ role: m.role, content: m.content }));
      const res: AssistantReply = await api.assistantChat(history, locale);
      setMessages([...next, { role: 'assistant', content: res.reply, vendors: res.vendors, searchUrl: res.searchUrl }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: t('error') }]);
    } finally {
      setBusy(false);
    }
  }

  const panelMotion = reduce
    ? {}
    : { initial: { opacity: 0, y: 24, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 24, scale: 0.96 } };

  return (
    <>
      {/* Launcher — pastki-o'ng suzuvchi tugma */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('title')}
        className="fixed bottom-20 right-4 z-[60] md:bottom-6 md:right-6 group inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-brand/30 transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 60%, #7C3AED 100%)' }}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-teal-400 ring-2 ring-white" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...panelMotion}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-36 right-4 z-[60] flex h-[70dvh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl md:bottom-24 md:right-6"
          >
            {/* Sarlavha */}
            <div
              className="flex items-center gap-3 px-4 py-3 text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 70%, #7C3AED 100%)' }}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold leading-tight">{t('title')}</p>
                <p className="text-xs text-white/80">{t('subtitle')}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label={t('close')} className="rounded-full p-1.5 transition hover:bg-white/15">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Xabarlar */}
            <div ref={scrollRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
              {/* Salomlashuv */}
              <Bubble role="assistant">{t('greeting')}</Bubble>

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-xs font-medium text-ink transition hover:border-brand/40 hover:bg-brand-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className="space-y-2">
                  <Bubble role={m.role}>{m.content}</Bubble>
                  {m.vendors && m.vendors.length > 0 && (
                    <div className="space-y-1.5">
                      {m.vendors.map((v) => (
                        <Link
                          key={v.id}
                          href={`/vendor/${v.slug}`}
                          className="flex items-center gap-2 rounded-xl border border-line bg-white p-2 transition hover:border-brand/40 hover:shadow-card"
                        >
                          <span className="text-lg">{v.category?.icon ?? '📍'}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-navy">{v.name}</span>
                            <span className="block truncate text-xs text-slate2">
                              {v.category?.name} · {v.district ?? 'Toshkent'}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-navy">
                            <Star className="h-3 w-3 fill-warning text-warning" /> {v.rating.toFixed(1)}
                          </span>
                        </Link>
                      ))}
                      {m.searchUrl && (
                        <Link
                          href={m.searchUrl}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-brand hover:underline"
                        >
                          {t('allResults')} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <Bubble role="assistant">
                  <span className="inline-flex items-center gap-2 text-slate2">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('thinking')}
                  </span>
                </Bubble>
              )}
            </div>

            {/* Kirish */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line bg-white/70 p-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy || enabled === false}
                placeholder={enabled === false ? t('soon') : t('placeholder')}
                className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none transition focus:border-brand/50 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !input.trim() || enabled === false}
                aria-label={t('send')}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #2563EB, #14B8A6)' }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-bg text-ink'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
