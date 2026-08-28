import { Link } from 'next-view-transitions';
import { Home, Search, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-wide flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <div className="relative">
        <span className="select-none bg-gradient-to-br from-brand via-teal to-violet bg-clip-text font-display text-[120px] font-bold leading-none text-transparent md:text-[160px]">
          404
        </span>
        <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-brand/10 blur-3xl" />
      </div>
      <div className="-mt-2 grid h-12 w-12 place-items-center rounded-2xl bg-surface shadow-card">
        <Compass className="text-brand" size={24} />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-navy">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-md text-slate2">
        Siz izlagan sahifa mavjud emas yoki ko‘chirilgan bo‘lishi mumkin. Quyidagi havolalar orqali davom eting.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Home size={16} /> Bosh sahifa
        </Link>
        <Link
          href="/qidiruv"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-slate2 transition hover:text-navy"
        >
          <Search size={16} /> Xizmat qidirish
        </Link>
      </div>
    </div>
  );
}
