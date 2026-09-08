import {
  Stethoscope, Smile, Sparkles, Dumbbell, UtensilsCrossed, Scissors,
  Gamepad2, BedDouble, Car, Pill, PawPrint, Home, Store, type LucideIcon,
} from 'lucide-react';

/**
 * Kategoriya slug → professional lucide (SVG) ikon. Emoji o'rniga izchil, brend-mos
 * chiziqli ikon tizimi (OS emoji platformaga qarab har xil/no'noq chiqardi).
 * Topilmasa — Store (umumiy do'kon/xizmat).
 */
const MAP: Record<string, LucideIcon> = {
  klinika: Stethoscope,
  stomatologiya: Smile,
  gozallik: Sparkles,
  fitnes: Dumbbell,
  restoran: UtensilsCrossed,
  barbershop: Scissors,
  'oyin-klub': Gamepad2,
  mehmonxona: BedDouble,
  'avto-xizmat': Car,
  dorixona: Pill,
  veterinariya: PawPrint,
  'kochmas-mulk': Home,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = MAP[slug] ?? Store;
  return <Icon className={className} aria-hidden />;
}
