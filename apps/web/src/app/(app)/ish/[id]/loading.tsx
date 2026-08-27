import { Sk } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="container-wide py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Sk className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Sk className="h-6 w-24 rounded-full" />
            <Sk className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-4 w-full" />)}
          </div>
        </div>
        <Sk className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
