import { readFileSync, writeFileSync } from 'node:fs';
const FILES = { uz: 'apps/web/src/messages/uz.json', ru: 'apps/web/src/messages/ru.json', en: 'apps/web/src/messages/en.json' };

const NS = {
  uz: {
    title: 'Biznesingiz uchun tarif tanlang', subtitle: 'Ko‘proq mijoz, past komissiya, yuqori joylashuv. Istalgan vaqtda o‘zgartiring.',
    badge: 'Tariflar', perMonth: 'so‘m/oy', free: 'Bepul', commission: 'Bron komissiyasi: {rate}%', cta: 'Tanlash', ctaCurrent: 'Joriy tarif', popular: 'Ommabop', kabinetHint: 'Tarifni kabinetda faollashtirasiz',
    plan: { FREE: { name: 'Bepul', desc: 'Boshlash uchun' }, PRO: { name: 'Pro', desc: 'O‘sayotgan biznes uchun' }, PREMIUM: { name: 'Premium', desc: 'Yetakchilar uchun' } },
    feat: {
      listing: 'Bepul e‘lon', photos5: '5 tagacha rasm', bookingOnline: 'Onlayn bron', support: 'Standart qo‘llab-quvvatlash',
      everythingFree: 'Bepul tarifdagi hammasi', badge: 'Pro belgisi', photos20: '20 tagacha rasm', analytics: 'Analitika paneli', higherRanking: 'Qidiruvda yuqori joylashuv', commission10: 'Komissiya 10%',
      everythingPro: 'Pro tarifdagi hammasi', topRanking: 'Qidiruvda eng yuqori', photos100: 'Cheksiz rasm', prioritySupport: 'Prioritet qo‘llab-quvvatlash', featuredHome: 'Bosh sahifada featured', commission7: 'Komissiya 7%',
    },
  },
  ru: {
    title: 'Выберите тариф для бизнеса', subtitle: 'Больше клиентов, ниже комиссия, выше позиция. Меняйте в любой момент.',
    badge: 'Тарифы', perMonth: 'сум/мес', free: 'Бесплатно', commission: 'Комиссия за бронь: {rate}%', cta: 'Выбрать', ctaCurrent: 'Текущий тариф', popular: 'Популярно', kabinetHint: 'Тариф активируется в кабинете',
    plan: { FREE: { name: 'Бесплатно', desc: 'Для старта' }, PRO: { name: 'Pro', desc: 'Для растущего бизнеса' }, PREMIUM: { name: 'Premium', desc: 'Для лидеров' } },
    feat: {
      listing: 'Бесплатное размещение', photos5: 'До 5 фото', bookingOnline: 'Онлайн-бронь', support: 'Стандартная поддержка',
      everythingFree: 'Всё из Бесплатного', badge: 'Значок Pro', photos20: 'До 20 фото', analytics: 'Панель аналитики', higherRanking: 'Выше в поиске', commission10: 'Комиссия 10%',
      everythingPro: 'Всё из Pro', topRanking: 'Топ в поиске', photos100: 'Безлимит фото', prioritySupport: 'Приоритетная поддержка', featuredHome: 'Featured на главной', commission7: 'Комиссия 7%',
    },
  },
  en: {
    title: 'Choose a plan for your business', subtitle: 'More customers, lower commission, higher ranking. Change anytime.',
    badge: 'Plans', perMonth: 'UZS/mo', free: 'Free', commission: 'Booking commission: {rate}%', cta: 'Choose', ctaCurrent: 'Current plan', popular: 'Popular', kabinetHint: 'Activate the plan in your cabinet',
    plan: { FREE: { name: 'Free', desc: 'To get started' }, PRO: { name: 'Pro', desc: 'For growing business' }, PREMIUM: { name: 'Premium', desc: 'For leaders' } },
    feat: {
      listing: 'Free listing', photos5: 'Up to 5 photos', bookingOnline: 'Online booking', support: 'Standard support',
      everythingFree: 'Everything in Free', badge: 'Pro badge', photos20: 'Up to 20 photos', analytics: 'Analytics dashboard', higherRanking: 'Higher in search', commission10: 'Commission 10%',
      everythingPro: 'Everything in Pro', topRanking: 'Top of search', photos100: 'Unlimited photos', prioritySupport: 'Priority support', featuredHome: 'Featured on homepage', commission7: 'Commission 7%',
    },
  },
};

const NAV = { uz: 'Tariflar', ru: 'Тарифы', en: 'Pricing' };
const KAB = {
  uz: { planTitle: 'Tarif', currentPlan: 'Joriy tarif', upgrade: 'Yangilash', earningsTitle: 'Daromad', revenue: 'Umumiy tushum', commission: 'Izla komissiyasi', net: 'Sizga o‘tadi', paidCount: 'To‘langan bronlar', activating: 'Faollashtirilmoqda…', activated: 'Tarif faollashtirildi', pickPlan: 'Tarifni tanlang', viewPricing: 'Barcha tariflar' },
  ru: { planTitle: 'Тариф', currentPlan: 'Текущий тариф', upgrade: 'Улучшить', earningsTitle: 'Доход', revenue: 'Общая выручка', commission: 'Комиссия Izla', net: 'Вам к выплате', paidCount: 'Оплаченные брони', activating: 'Активируем…', activated: 'Тариф активирован', pickPlan: 'Выберите тариф', viewPricing: 'Все тарифы' },
  en: { planTitle: 'Plan', currentPlan: 'Current plan', upgrade: 'Upgrade', earningsTitle: 'Earnings', revenue: 'Total revenue', commission: 'Izla commission', net: 'Your payout', paidCount: 'Paid bookings', activating: 'Activating…', activated: 'Plan activated', pickPlan: 'Choose a plan', viewPricing: 'All plans' },
};

for (const [lang, file] of Object.entries(FILES)) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  json.narxlar = NS[lang];
  if (json.nav) json.nav.pricing = NAV[lang];
  if (json.kabinet) json.kabinet.plans = KAB[lang];
  else json.kabinet = { plans: KAB[lang] };
  writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`[${lang}] narxlar + nav.pricing + kabinet.plans yozildi`);
}
