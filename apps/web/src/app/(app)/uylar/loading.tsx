import { VendorGridSkeleton, HeaderSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="container-wide py-8">
      <HeaderSkeleton />
      <div className="mt-8">
        <VendorGridSkeleton count={8} />
      </div>
    </div>
  );
}
