import { readFileSync, writeFileSync } from 'node:fs';
const FILES = { uz: 'apps/web/src/messages/uz.json', ru: 'apps/web/src/messages/ru.json', en: 'apps/web/src/messages/en.json' };

const NS = {
  uz: {
    title: 'Nasiya — bo‘lib to‘lash', subtitle: 'Xaridni bo‘lib to‘lang. Provayderlarni taqqoslang va aniq oylik to‘lovni ko‘ring.',
    badge: 'Izla Nasiya', point1: '3 oy 0% ustama', point2: 'Bir necha daqiqada qaror', point3: 'Ishonchli provayderlar', myAppsLink: 'Mening arizalarim',
    amount: 'Xarid summasi', term: 'Muddat', months: 'oy', providersHeading: 'Provayderlar', monthly: 'Oylik to‘lov', total: 'Jami', overpay: 'Ustama', free: '0 so‘m', markup: 'ustama', notAvailable: 'Bu summa/muddat mavjud emas',
    apply: { cta: 'Ariza yuborish', loginCta: 'Kirish va ariza', title: 'Nasiya arizasi', subtitle: '{provider} siz bilan bog‘lanadi', name: 'Ismingiz', submit: 'Yuborish', sending: 'Yuborilmoqda…', done: 'Ariza yuborildi', doneTitle: 'Ariza qabul qilindi', doneMsg: 'Provayder tez orada bog‘lanadi.', myApps: 'Arizalarim' },
    myApps: { title: 'Mening arizalarim', subtitle: 'Nasiya arizalaringiz', loginNeeded: 'Arizalarni ko‘rish uchun kiring', login: 'Kirish', empty: 'Hozircha ariza yo‘q', emptyCta: 'Nasiya hisoblash', status: { NEW: 'Yangi', CONTACTED: 'Bog‘lanildi', APPROVED: 'Tasdiqlandi', ISSUED: 'Rasmiylashtirildi', REJECTED: 'Rad etildi' } },
    attach: { title: 'Bo‘lib to‘lash mavjud', text: 'Bu xizmatni nasiyaga rasmiylashtiring.', cta: 'Nasiyani hisoblash' },
  },
  ru: {
    title: 'Рассрочка', subtitle: 'Оплатите покупку частями. Сравните провайдеров и точный ежемесячный платёж.',
    badge: 'Izla Рассрочка', point1: '3 месяца 0% наценки', point2: 'Решение за пару минут', point3: 'Надёжные провайдеры', myAppsLink: 'Мои заявки',
    amount: 'Сумма покупки', term: 'Срок', months: 'мес', providersHeading: 'Провайдеры', monthly: 'Ежемесячно', total: 'Всего', overpay: 'Наценка', free: '0 сум', markup: 'наценка', notAvailable: 'Сумма/срок недоступны',
    apply: { cta: 'Оставить заявку', loginCta: 'Войти и подать', title: 'Заявка на рассрочку', subtitle: '{provider} свяжется с вами', name: 'Ваше имя', submit: 'Отправить', sending: 'Отправляем…', done: 'Заявка отправлена', doneTitle: 'Заявка принята', doneMsg: 'Провайдер скоро свяжется.', myApps: 'Мои заявки' },
    myApps: { title: 'Мои заявки', subtitle: 'Ваши заявки на рассрочку', loginNeeded: 'Войдите, чтобы увидеть заявки', login: 'Войти', empty: 'Пока нет заявок', emptyCta: 'Рассчитать рассрочку', status: { NEW: 'Новая', CONTACTED: 'Связались', APPROVED: 'Одобрена', ISSUED: 'Оформлена', REJECTED: 'Отклонена' } },
    attach: { title: 'Доступна рассрочка', text: 'Оформите эту услугу в рассрочку.', cta: 'Рассчитать рассрочку' },
  },
  en: {
    title: 'Installments (BNPL)', subtitle: 'Pay for your purchase in parts. Compare providers and the exact monthly payment.',
    badge: 'Izla Installments', point1: '3 months 0% markup', point2: 'Decision in minutes', point3: 'Trusted providers', myAppsLink: 'My applications',
    amount: 'Purchase amount', term: 'Term', months: 'mo', providersHeading: 'Providers', monthly: 'Monthly', total: 'Total', overpay: 'Markup', free: '0 UZS', markup: 'markup', notAvailable: 'Amount/term not available',
    apply: { cta: 'Apply', loginCta: 'Sign in & apply', title: 'Installment application', subtitle: '{provider} will contact you', name: 'Your name', submit: 'Submit', sending: 'Sending…', done: 'Application sent', doneTitle: 'Application received', doneMsg: 'The provider will contact you shortly.', myApps: 'My applications' },
    myApps: { title: 'My applications', subtitle: 'Your installment applications', loginNeeded: 'Sign in to see applications', login: 'Sign in', empty: 'No applications yet', emptyCta: 'Calculate installment', status: { NEW: 'New', CONTACTED: 'Contacted', APPROVED: 'Approved', ISSUED: 'Issued', REJECTED: 'Rejected' } },
    attach: { title: 'Installments available', text: 'Get this service on installments.', cta: 'Calculate installment' },
  },
};

const NAV = { uz: 'Nasiya', ru: 'Рассрочка', en: 'Installments' };

for (const [lang, file] of Object.entries(FILES)) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  json.nasiya = NS[lang];
  if (json.nav) json.nav.installment = NAV[lang];
  writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`[${lang}] nasiya + nav.installment yozildi`);
}
