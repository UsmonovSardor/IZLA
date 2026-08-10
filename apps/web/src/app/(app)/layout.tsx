/** Ichki sahifalar uchun umumiy konteyner (to'liq kenglik + responsive padding).
 *  Bosh sahifa (/) va aurora hero bu guruhdan tashqarida — to'liq full-bleed. */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <div className="container-wide py-8">{children}</div>;
}
