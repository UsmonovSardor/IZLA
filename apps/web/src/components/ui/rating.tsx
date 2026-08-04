import { Star } from 'lucide-react';
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-warning text-warning" />
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      {count != null && <span className="text-slate2">({count})</span>}
    </span>
  );
}
