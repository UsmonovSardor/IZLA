import { JobGridSkeleton, HeaderSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="container-wide py-8">
      <HeaderSkeleton />
      <div className="mt-8 grid gap-6 md:grid-cols-[248px_1fr]">
        <div className="hidden h-64 rounded-2xl border border-line bg-surface md:block" />
        <JobGridSkeleton count={6} />
      </div>
    </div>
  );
}
