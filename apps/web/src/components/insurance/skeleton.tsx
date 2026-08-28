export function InsuranceSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="skeleton h-11 w-11 rounded-2xl" />
            <div className="flex-1">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton mt-2 h-4 w-28 rounded" />
            </div>
          </div>
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="mt-2 flex items-end justify-between">
            <div className="skeleton h-6 w-24 rounded" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
