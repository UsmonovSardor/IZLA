'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';

interface SavedJobsApi {
  has: (jobId: string) => boolean;
  toggle: (jobId: string) => Promise<boolean>;
  count: number;
  ready: boolean;
}

const Ctx = createContext<SavedJobsApi | null>(null);

/** Saqlangan vakansiya id'larini bir marta yuklab, barcha bookmark tugmalari bilan bo'lishadi. */
export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user) { setIds(new Set()); setReady(true); return; }
    setReady(false);
    api.savedJobIds()
      .then((list) => { if (alive) { setIds(new Set(list)); setReady(true); } })
      .catch(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [user]);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(async (id: string) => {
    // Optimistik
    const next = new Set(ids);
    const willSave = !next.has(id);
    if (willSave) next.add(id); else next.delete(id);
    setIds(next);
    try {
      const r = await api.toggleSavedJob(id);
      setIds((cur) => {
        const s = new Set(cur);
        if (r.saved) s.add(id); else s.delete(id);
        return s;
      });
      return r.saved;
    } catch {
      // Xatoda ortga qaytaramiz
      setIds((cur) => {
        const s = new Set(cur);
        if (willSave) s.delete(id); else s.add(id);
        return s;
      });
      throw new Error('toggle failed');
    }
  }, [ids]);

  return <Ctx.Provider value={{ has, toggle, count: ids.size, ready }}>{children}</Ctx.Provider>;
}

export function useSavedJobs(): SavedJobsApi {
  const ctx = useContext(Ctx);
  if (!ctx) return { has: () => false, toggle: async () => false, count: 0, ready: false };
  return ctx;
}
