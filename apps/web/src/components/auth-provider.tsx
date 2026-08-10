'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type AuthUser,
  type Providers,
  refreshSession,
  getProviders,
  logout as apiLogout,
} from '@/lib/auth';
import { LoginModal } from './login-modal';

interface LoginOpts {
  next?: string;
  onDone?: (u: AuthUser) => void;
}
interface LoginState {
  open: boolean;
  opts: LoginOpts;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  providers: Providers;
  applyUser: (u: AuthUser) => void;
  refreshUser: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
  openLogin: (opts?: LoginOpts) => void;
  closeLogin: () => void;
  login: LoginState;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Providers>({ phone: true, telegram: false, google: false });
  const [login, setLogin] = useState<LoginState>({ open: false, opts: {} });

  // Sahifa yuklanganda: provayderlar + jim sessiya tiklash
  useEffect(() => {
    let alive = true;
    void getProviders().then((p) => alive && setProviders(p));
    void refreshSession().then((u) => {
      if (!alive) return;
      setUser(u);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const applyUser = useCallback((u: AuthUser) => setUser(u), []);

  const refreshUser = useCallback(async () => {
    const u = await refreshSession();
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const openLogin = useCallback((opts: LoginOpts = {}) => setLogin({ open: true, opts }), []);
  const closeLogin = useCallback(() => setLogin((s) => ({ ...s, open: false })), []);

  const onModalSuccess = useCallback(
    (u: AuthUser) => {
      setUser(u);
      const done = login.opts.onDone;
      setLogin({ open: false, opts: {} });
      done?.(u);
    },
    [login.opts],
  );

  const value = useMemo(
    () => ({ user, loading, providers, applyUser, refreshUser, signOut, openLogin, closeLogin, login }),
    [user, loading, providers, applyUser, refreshUser, signOut, openLogin, closeLogin, login],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal open={login.open} providers={providers} onClose={closeLogin} onSuccess={onModalSuccess} />
    </AuthContext.Provider>
  );
}
