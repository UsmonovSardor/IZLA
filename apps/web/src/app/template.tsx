/**
 * Sahifa o'tishi endi native View Transitions API bilan boshqariladi
 * (next-view-transitions + globals.css `::view-transition` crossfade).
 * Template pass-through — qo'shimcha animatsiya yo'q (ikki marta bo'lmasligi uchun).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
