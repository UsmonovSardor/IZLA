/** Qayta ishlatiladigan skeleton primitivlar (globals.css `.skeleton` shimmer).
 *  Haqiqiy layout bilan mos — layout-shift (CLS) 0 bo'lishi uchun. */

export function Sk({ className = '' }: { className?: string }) {
  return <span className={`skeleton block rounded-md ${className}`} />;
}

/** Vendor kartasi skeleton — VendorCard bilan bir o'lchamda. */
export function VendorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Sk className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Sk className="h-4 w-3/4" />
        <Sk className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Sk className="h-5 w-16 rounded-full" />
          <Sk className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function VendorGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <VendorCardSkeleton key={i} />)}
    </div>
  );
}

/** Vakansiya kartasi skeleton. */
export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <Sk className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Sk className="h-4 w-2/3" />
          <Sk className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Sk className="h-3 w-full" />
        <Sk className="h-3 w-5/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <Sk className="h-6 w-16 rounded-full" />
        <Sk className="h-6 w-20 rounded-full" />
        <Sk className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function JobGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => <JobCardSkeleton key={i} />)}
    </div>
  );
}

/** Sahifa sarlavhasi skeleton. */
export function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Sk className="h-8 w-64" />
      <Sk className="h-4 w-96 max-w-full" />
    </div>
  );
}
