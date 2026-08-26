'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Check, Clock } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

/** Ariza tugmasi — hozircha "tez orada" (to'liq ariza oqimi keyingi increment).
 * Login bo'lmasa avval kirishni taklif qiladi. */
export function ApplyButton({ block = false }: { block?: boolean }) {
  const t = useTranslations('ish');
  const { user, openLogin } = useAuth();
  const [soon, setSoon] = useState(false);

  const click = () => {
    if (!user) { openLogin(); return; }
    setSoon(true);
  };

  return (
    <button
      onClick={click}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 ${block ? 'w-full' : ''}`}
    >
      {soon ? <Check size={17} /> : <Send size={16} />}
      {soon ? t('applySoon') : t('apply')}
      {soon && <Clock size={14} className="opacity-70" />}
    </button>
  );
}
