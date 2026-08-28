'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Search } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Suggestion = { id: string; slug: string; name: string; icon?: string; category: string };

/** Hero qidiruv — debounced autocomplete (vendor takliflari), klaviatura navigatsiyasi. */
export function SearchAutocomplete({ placeholder, buttonLabel }: { placeholder: string; buttonLabel: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    const ctrl = new AbortController();
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/vendors/suggest?q=${encodeURIComponent(term)}&lang=${locale}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as Suggestion[];
        setItems(data);
        setOpen(data.length > 0);
        setActive(-1);
      } catch {
        /* abort / tarmoq — jim */
      }
    }, 180);
    return () => {
      ctrl.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, locale]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function submit(term: string) {
    const t = term.trim();
    if (!t) return;
    setOpen(false);
    router.push(`/qidiruv?q=${encodeURIComponent(t)}`);
  }
  function goto(s: Suggestion) {
    setOpen(false);
    router.push(`/vendor/${s.slug}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      if (active >= 0 && items[active]) {
        e.preventDefault();
        goto(items[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-pop"
        role="search"
      >
        <Search className="ml-3 h-5 w-5 shrink-0 text-slate2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-ink outline-none placeholder:text-slate2"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
        >
          {buttonLabel}
        </button>
      </form>

      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-pop">
          {items.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => goto(s)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                  i === active ? 'bg-brand-50' : 'hover:bg-bg'
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-base">
                  {s.icon ?? '📍'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{s.name}</span>
                  <span className="block truncate text-xs text-slate2">{s.category}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
