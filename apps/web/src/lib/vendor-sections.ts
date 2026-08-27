/**
 * Moslashuvchan vendor sahifasi konfiguratsiyasi.
 * Har bir kategoriya (`category.slug`) uchun: urg'u rangi, hero turi, bo'limlar tartibi
 * va umumiy marketing kontenti (i18n kalitlari — 3 tilga tarjima qilinadi).
 *
 * Har-vendor REAL faktlar (jamoa+foto, counter, galereya) `vendor.attributes`dan keladi;
 * bu yerda faqat KATEGORIYAGA umumiy, takrorlanuvchi chrome/matn turadi.
 */

export type SectionId =
  | 'counters'
  | 'services'
  | 'whyChoose'
  | 'team'
  | 'howItWork'
  | 'gallery'
  | 'reviews'
  | 'map';

/** Hero'da odam (shifokor/usta) yoki joy (restoran/mehmonxona) urg'ulanadimi. */
export type HeroKind = 'person' | 'place';

export interface HighlightDef {
  /** lucide-react ikon nomi (VendorIcon xaritasida). */
  icon: string;
  /** i18n kaliti: vendorPage.cat.<slug>.highlights.<key> */
  key: string;
}
export interface StepDef {
  icon: string;
  key: string; // vendorPage.cat.<slug>.steps.<key>
}

export interface CategorySectionConfig {
  /** Tailwind urg'u — CSS o'zgaruvchilari orqali (accent / accentSoft). */
  accent: string;
  accentSoft: string;
  heroKind: HeroKind;
  /** Ko'rsatiladigan bo'limlar (tartibda). Booking paneli har doim alohida. */
  sections: SectionId[];
  /** i18n namespace segmenti (highlights/steps qidiriladigan sub-namespace). */
  i18nKey: string;
  highlights: HighlightDef[];
  steps: StepDef[];
  /** "person" hero uchun jamoa yorlig'i kaliti (masalan shifokorlar / ustalar). */
  teamLabelKey: string;
  /** Xizmatlar bo'limi sarlavha kaliti. */
  servicesLabelKey: string;
}

const DENTAL: CategorySectionConfig = {
  accent: '#2563EB',
  accentSoft: '#EAF1FF',
  heroKind: 'person',
  sections: ['counters', 'services', 'whyChoose', 'team', 'howItWork', 'gallery', 'reviews', 'map'],
  i18nKey: 'stomatologiya',
  teamLabelKey: 'team.doctors',
  servicesLabelKey: 'services.dental',
  highlights: [
    { icon: 'Stethoscope', key: 'experiencedDoctors' },
    { icon: 'Ambulance', key: 'emergency' },
    { icon: 'HeartHandshake', key: 'personalCare' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Wallet', key: 'flexiblePayment' },
    { icon: 'Cpu', key: 'latestTech' },
  ],
  steps: [
    { icon: 'CalendarCheck', key: 'book' },
    { icon: 'Stethoscope', key: 'consult' },
    { icon: 'Sparkles', key: 'treatment' },
    { icon: 'Smile', key: 'aftercare' },
  ],
};

const CLINIC: CategorySectionConfig = {
  ...DENTAL,
  i18nKey: 'klinika',
  servicesLabelKey: 'services.clinic',
  highlights: [
    { icon: 'Stethoscope', key: 'experiencedDoctors' },
    { icon: 'Ambulance', key: 'emergency' },
    { icon: 'Microscope', key: 'modernLab' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Wallet', key: 'insurance' },
    { icon: 'ShieldCheck', key: 'licensed' },
  ],
};

const BEAUTY: CategorySectionConfig = {
  accent: '#DB2777',
  accentSoft: '#FCE7F3',
  heroKind: 'person',
  sections: ['counters', 'services', 'whyChoose', 'team', 'howItWork', 'gallery', 'reviews', 'map'],
  i18nKey: 'gozallik',
  teamLabelKey: 'team.masters',
  servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Sparkles', key: 'topMasters' },
    { icon: 'HeartHandshake', key: 'personalCare' },
    { icon: 'ShieldCheck', key: 'hygiene' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Wallet', key: 'flexiblePayment' },
    { icon: 'Gem', key: 'premiumProducts' },
  ],
  steps: [
    { icon: 'CalendarCheck', key: 'book' },
    { icon: 'HeartHandshake', key: 'consult' },
    { icon: 'Sparkles', key: 'treatment' },
    { icon: 'Smile', key: 'aftercare' },
  ],
};

const RESTAURANT: CategorySectionConfig = {
  accent: '#EA580C',
  accentSoft: '#FFF1E8',
  heroKind: 'place',
  sections: ['counters', 'services', 'whyChoose', 'team', 'howItWork', 'gallery', 'reviews', 'map'],
  i18nKey: 'restoran',
  teamLabelKey: 'team.chefs',
  servicesLabelKey: 'services.menu',
  highlights: [
    { icon: 'ChefHat', key: 'chef' },
    { icon: 'Leaf', key: 'freshIngredients' },
    { icon: 'Wine', key: 'atmosphere' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'CalendarCheck', key: 'reservation' },
    { icon: 'Bike', key: 'delivery' },
  ],
  steps: [
    { icon: 'CalendarCheck', key: 'reserve' },
    { icon: 'MapPin', key: 'arrive' },
    { icon: 'UtensilsCrossed', key: 'enjoy' },
    { icon: 'Star', key: 'share' },
  ],
};

const ALL: SectionId[] = ['counters', 'services', 'whyChoose', 'team', 'howItWork', 'gallery', 'reviews', 'map'];

const FITNESS: CategorySectionConfig = {
  accent: '#16A34A', accentSoft: '#E7F6EC', heroKind: 'place', sections: ALL,
  i18nKey: 'fitnes', teamLabelKey: 'team.trainers', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Award', key: 'certifiedTrainers' },
    { icon: 'Dumbbell', key: 'modernEquipment' },
    { icon: 'Users', key: 'groupClasses' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Wallet', key: 'flexibleMembership' },
    { icon: 'Waves', key: 'sauna' },
  ],
  steps: [
    { icon: 'Search', key: 'choose' }, { icon: 'CalendarCheck', key: 'book' },
    { icon: 'Dumbbell', key: 'train' }, { icon: 'TrendingUp', key: 'progress' },
  ],
};

const BARBER: CategorySectionConfig = {
  accent: '#B45309', accentSoft: '#FBF0E2', heroKind: 'person', sections: ALL,
  i18nKey: 'barbershop', teamLabelKey: 'team.barbers', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Scissors', key: 'masterBarbers' },
    { icon: 'ShieldCheck', key: 'hygiene' },
    { icon: 'Gem', key: 'premiumProducts' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Sparkles', key: 'styleConsult' },
    { icon: 'Coffee', key: 'atmosphere' },
  ],
  steps: [
    { icon: 'CalendarCheck', key: 'book' }, { icon: 'HeartHandshake', key: 'consult' },
    { icon: 'Scissors', key: 'cut' }, { icon: 'Smile', key: 'enjoy' },
  ],
};

const AUTO: CategorySectionConfig = {
  accent: '#DC2626', accentSoft: '#FCE9E9', heroKind: 'place', sections: ALL,
  i18nKey: 'avto', teamLabelKey: 'team.mechanics', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Award', key: 'certifiedMechanics' },
    { icon: 'ShieldCheck', key: 'genuineParts' },
    { icon: 'Gauge', key: 'diagnostics' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'CheckCircle2', key: 'warranty' },
    { icon: 'Zap', key: 'fastService' },
  ],
  steps: [
    { icon: 'CalendarCheck', key: 'book' }, { icon: 'Gauge', key: 'diagnose' },
    { icon: 'Wrench', key: 'repair' }, { icon: 'Car', key: 'pickup' },
  ],
};

const VET: CategorySectionConfig = {
  accent: '#0D9488', accentSoft: '#E2F5F2', heroKind: 'person', sections: ALL,
  i18nKey: 'veterinariya', teamLabelKey: 'team.vets', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Stethoscope', key: 'experiencedVets' },
    { icon: 'Ambulance', key: 'emergency' },
    { icon: 'Microscope', key: 'modernLab' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'HeartHandshake', key: 'gentleCare' },
    { icon: 'Pill', key: 'pharmacy' },
  ],
  steps: [
    { icon: 'CalendarCheck', key: 'book' }, { icon: 'Stethoscope', key: 'consult' },
    { icon: 'Sparkles', key: 'treat' }, { icon: 'Smile', key: 'aftercare' },
  ],
};

const PHARMACY: CategorySectionConfig = {
  accent: '#059669', accentSoft: '#E4F6EF', heroKind: 'place',
  sections: ['counters', 'services', 'whyChoose', 'howItWork', 'gallery', 'reviews', 'map'],
  i18nKey: 'dorixona', teamLabelKey: 'team.staff', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'ShieldCheck', key: 'licensed' },
    { icon: 'Pill', key: 'genuineMeds' },
    { icon: 'Stethoscope', key: 'consultation' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Bike', key: 'delivery' },
    { icon: 'Clock', key: 'available' },
  ],
  steps: [
    { icon: 'Search', key: 'find' }, { icon: 'CalendarCheck', key: 'order' },
    { icon: 'HeartHandshake', key: 'consult' }, { icon: 'CheckCircle2', key: 'receive' },
  ],
};

const HOTEL: CategorySectionConfig = {
  accent: '#7C3AED', accentSoft: '#F0EAFE', heroKind: 'place', sections: ALL,
  i18nKey: 'mehmonxona', teamLabelKey: 'team.staff', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'BedDouble', key: 'comfortRooms' },
    { icon: 'Coffee', key: 'breakfast' },
    { icon: 'Wifi', key: 'wifi' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Clock', key: 'reception' },
    { icon: 'Car', key: 'parking' },
  ],
  steps: [
    { icon: 'Search', key: 'choose' }, { icon: 'CalendarCheck', key: 'book' },
    { icon: 'KeyRound', key: 'checkin' }, { icon: 'Smile', key: 'enjoy' },
  ],
};

const GAMING: CategorySectionConfig = {
  accent: '#DB2777', accentSoft: '#FCE7F1', heroKind: 'place', sections: ALL,
  i18nKey: 'oyin', teamLabelKey: 'team.staff', servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Gamepad2', key: 'latestConsoles' },
    { icon: 'Sofa', key: 'comfortZones' },
    { icon: 'UtensilsCrossed', key: 'snacks' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Trophy', key: 'tournaments' },
    { icon: 'CalendarCheck', key: 'booking' },
  ],
  steps: [
    { icon: 'Search', key: 'choose' }, { icon: 'CalendarCheck', key: 'book' },
    { icon: 'Gamepad2', key: 'play' }, { icon: 'Star', key: 'share' },
  ],
};

/** Umumiy fallback — hali maxsus sozlanmagan kategoriyalar uchun. */
const DEFAULT: CategorySectionConfig = {
  accent: '#2563EB',
  accentSoft: '#EAF1FF',
  heroKind: 'place',
  sections: ['counters', 'services', 'whyChoose', 'gallery', 'reviews', 'map'],
  i18nKey: 'default',
  teamLabelKey: 'team.staff',
  servicesLabelKey: 'services.default',
  highlights: [
    { icon: 'Award', key: 'trusted' },
    { icon: 'Clock', key: 'fastBooking' },
    { icon: 'HeartHandshake', key: 'personalCare' },
    { icon: 'Star', key: 'positiveReviews' },
    { icon: 'Wallet', key: 'flexiblePayment' },
    { icon: 'ShieldCheck', key: 'verified' },
  ],
  steps: [
    { icon: 'Search', key: 'choose' },
    { icon: 'CalendarCheck', key: 'book' },
    { icon: 'CheckCircle2', key: 'confirm' },
    { icon: 'Smile', key: 'enjoy' },
  ],
};

const MAP: Record<string, CategorySectionConfig> = {
  stomatologiya: DENTAL,
  klinika: CLINIC,
  gozallik: BEAUTY,
  restoran: RESTAURANT,
  fitnes: FITNESS,
  barbershop: BARBER,
  'avto-xizmat': AUTO,
  veterinariya: VET,
  dorixona: PHARMACY,
  mehmonxona: HOTEL,
  'oyin-klub': GAMING,
};

export function sectionConfig(categorySlug?: string): CategorySectionConfig {
  return (categorySlug && MAP[categorySlug]) || DEFAULT;
}
