import { Sk } from '@/components/skeletons';

export default function Loading() {
  return (
    <div>
      {/* Hero */}
      <div className="container-wide py-8">
        <Sk className="h-72 w-full rounded-3xl md:h-96" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Sk className="h-7 w-1/2" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-5/6" />
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-20 rounded-2xl" />)}
            </div>
          </div>
          <Sk className="h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
