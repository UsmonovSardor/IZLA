import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-navy">404</h1>
      <p className="text-slate2 mt-2">Sahifa topilmadi.</p>
      <Link href="/" className="mt-4 inline-block text-brand font-medium">← Bosh sahifa</Link>
    </div>
  );
}
