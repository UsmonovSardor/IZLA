import {
  Stethoscope, Ambulance, HeartHandshake, Star, Wallet, Cpu, Microscope,
  ShieldCheck, Sparkles, Gem, Award, Clock, Search, CalendarCheck, CheckCircle2,
  Smile, ChefHat, Leaf, Wine, Bike, MapPin, UtensilsCrossed,
  Dumbbell, Users, Waves, TrendingUp, Scissors, Wrench, Gauge, Car, Zap,
  PawPrint, Pill, BedDouble, Coffee, Wifi, KeyRound, Gamepad2, Trophy, Sofa,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Stethoscope, Ambulance, HeartHandshake, Star, Wallet, Cpu, Microscope,
  ShieldCheck, Sparkles, Gem, Award, Clock, Search, CalendarCheck, CheckCircle2, Smile,
  ChefHat, Leaf, Wine, Bike, MapPin, UtensilsCrossed,
  Dumbbell, Users, Waves, TrendingUp, Scissors, Wrench, Gauge, Car, Zap,
  PawPrint, Pill, BedDouble, Coffee, Wifi, KeyRound, Gamepad2, Trophy, Sofa,
};

/** Konfiguratsiyadagi ikon nomini lucide komponentiga aylantiradi (topilmasa Sparkles). */
export function VendorIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
