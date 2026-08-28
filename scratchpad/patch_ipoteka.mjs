import { readFileSync, writeFileSync } from 'node:fs';

const FILES = { uz: 'apps/web/src/messages/uz.json', ru: 'apps/web/src/messages/ru.json', en: 'apps/web/src/messages/en.json' };

const NS = {
  uz: {
    title: 'Ipoteka — aniq oylik to‘lovni hisoblang', subtitle: 'Eng yaxshi bank dasturlarini solishtiring, oylik to‘lovni aniq bilib oling va onlayn ariza qoldiring.',
    badge: 'Izla Ipoteka', point1: 'Aniq oylik to‘lov', point2: 'Eng past stavkalar', point3: 'Onlayn ariza', myAppsLink: 'Mening arizalarim', backToList: 'Barcha dasturlar',
    calcHeading: 'Ipoteka kalkulyatori', programsHeading: 'Bank dasturlari',
    calc: {
      configure: 'Parametrlarni tanlang', price: 'Uy narxi', downPayment: 'Boshlang‘ich to‘lov', minDown: 'Minimal {pct}%', term: 'Muddat', years: 'yil', months: 'oy',
      rate: 'Yillik stavka', monthly: 'Oylik to‘lov', perMonth: 'oyiga', loanAmount: 'Kredit summasi', downPaid: 'Boshlang‘ich to‘lov', total: 'Jami to‘lov', overpayment: 'Ortiqcha to‘lov',
      chooseProgram: 'Dasturni tanlash', disclaimer: 'Hisob taxminiy — yakuniy shartlar bank tomonidan tasdiqlanadi.',
    },
    card: { rate: 'Stavka', monthlyFrom: 'Oylik to‘lov dan', minDown: 'Boshlang‘ich', years: 'yil', calculate: 'Hisoblash', popular: 'Ommabop', subsidized: 'Imtiyozli' },
    filter: {
      title: 'Filtr', clear: 'Tozalash', subsidized: 'Imtiyozli dasturlar', bank: 'Bank', maxRate: 'Stavka (gacha)', propertyType: 'Uy turi',
      sort: 'Saralash', sortPopular: 'Ommabop', sortRate: 'Past stavka', sortMonthly: 'Past oylik', sortRating: 'Reyting', results: '{count} ta dastur', empty: 'Mos dastur topilmadi',
    },
    propType: { NEW: 'Yangi uy', SECONDARY: 'Ikkilamchi', CONSTRUCTION: 'Qurilayotgan' },
    facts: { maxTerm: 'Maksimal muddat', maxAmount: 'Maksimal summa' },
    apply: {
      cta: 'Ariza yuborish', loginCta: 'Kirish va ariza', title: 'Ipoteka arizasi', subtitle: '{bank} siz bilan bog‘lanadi', name: 'Ismingiz', submit: 'Yuborish', sending: 'Yuborilmoqda…',
      done: 'Ariza yuborildi', doneTitle: 'Ariza qabul qilindi', doneMsg: 'Bank tez orada siz bilan bog‘lanadi.', myApps: 'Arizalarim',
    },
    myApps: {
      title: 'Mening arizalarim', subtitle: 'Ipoteka arizalaringiz holati', loginNeeded: 'Arizalaringizni ko‘rish uchun kiring', login: 'Kirish',
      empty: 'Hozircha ariza yo‘q', emptyCta: 'Ipoteka tanlash', generic: 'Ipoteka arizasi', price: 'Uy narxi',
      status: { NEW: 'Yangi', CONTACTED: 'Bog‘lanildi', APPROVED: 'Tasdiqlandi', FUNDED: 'Kredit berildi', REJECTED: 'Rad etildi' },
    },
    attach: { title: 'Bu uyni ipoteka bilan oling', text: 'Oylik to‘lovni hisoblang va bankka ariza qoldiring.', cta: 'Ipotekani hisoblash' },
  },
  ru: {
    title: 'Ипотека — рассчитайте точный платёж', subtitle: 'Сравните лучшие банковские программы, узнайте точный ежемесячный платёж и оставьте заявку онлайн.',
    badge: 'Izla Ипотека', point1: 'Точный ежемесячный платёж', point2: 'Самые низкие ставки', point3: 'Онлайн-заявка', myAppsLink: 'Мои заявки', backToList: 'Все программы',
    calcHeading: 'Ипотечный калькулятор', programsHeading: 'Банковские программы',
    calc: {
      configure: 'Выберите параметры', price: 'Стоимость жилья', downPayment: 'Первоначальный взнос', minDown: 'Минимум {pct}%', term: 'Срок', years: 'лет', months: 'мес',
      rate: 'Годовая ставка', monthly: 'Ежемесячный платёж', perMonth: 'в месяц', loanAmount: 'Сумма кредита', downPaid: 'Первый взнос', total: 'Всего к оплате', overpayment: 'Переплата',
      chooseProgram: 'Выбрать программу', disclaimer: 'Расчёт ориентировочный — итоговые условия подтверждает банк.',
    },
    card: { rate: 'Ставка', monthlyFrom: 'Платёж от', minDown: 'Взнос', years: 'лет', calculate: 'Рассчитать', popular: 'Популярно', subsidized: 'Льготная' },
    filter: {
      title: 'Фильтр', clear: 'Сбросить', subsidized: 'Льготные программы', bank: 'Банк', maxRate: 'Ставка (до)', propertyType: 'Тип жилья',
      sort: 'Сортировка', sortPopular: 'Популярные', sortRate: 'Низкая ставка', sortMonthly: 'Низкий платёж', sortRating: 'Рейтинг', results: '{count} программ', empty: 'Подходящих программ не найдено',
    },
    propType: { NEW: 'Новостройка', SECONDARY: 'Вторичное', CONSTRUCTION: 'Строящееся' },
    facts: { maxTerm: 'Максимальный срок', maxAmount: 'Максимальная сумма' },
    apply: {
      cta: 'Оставить заявку', loginCta: 'Войти и подать заявку', title: 'Заявка на ипотеку', subtitle: '{bank} свяжется с вами', name: 'Ваше имя', submit: 'Отправить', sending: 'Отправляем…',
      done: 'Заявка отправлена', doneTitle: 'Заявка принята', doneMsg: 'Банк свяжется с вами в ближайшее время.', myApps: 'Мои заявки',
    },
    myApps: {
      title: 'Мои заявки', subtitle: 'Статус ваших ипотечных заявок', loginNeeded: 'Войдите, чтобы увидеть свои заявки', login: 'Войти',
      empty: 'Пока нет заявок', emptyCta: 'Выбрать ипотеку', generic: 'Заявка на ипотеку', price: 'Стоимость жилья',
      status: { NEW: 'Новая', CONTACTED: 'Связались', APPROVED: 'Одобрена', FUNDED: 'Кредит выдан', REJECTED: 'Отклонена' },
    },
    attach: { title: 'Купите это жильё в ипотеку', text: 'Рассчитайте платёж и оставьте заявку в банк.', cta: 'Рассчитать ипотеку' },
  },
  en: {
    title: 'Mortgage — calculate the exact payment', subtitle: 'Compare the best bank programs, know your exact monthly payment and apply online.',
    badge: 'Izla Mortgage', point1: 'Exact monthly payment', point2: 'Lowest rates', point3: 'Online application', myAppsLink: 'My applications', backToList: 'All programs',
    calcHeading: 'Mortgage calculator', programsHeading: 'Bank programs',
    calc: {
      configure: 'Choose parameters', price: 'Property price', downPayment: 'Down payment', minDown: 'Minimum {pct}%', term: 'Term', years: 'years', months: 'mo',
      rate: 'Annual rate', monthly: 'Monthly payment', perMonth: 'per month', loanAmount: 'Loan amount', downPaid: 'Down payment', total: 'Total payable', overpayment: 'Overpayment',
      chooseProgram: 'Choose a program', disclaimer: 'Estimate only — final terms are confirmed by the bank.',
    },
    card: { rate: 'Rate', monthlyFrom: 'Payment from', minDown: 'Down', years: 'yrs', calculate: 'Calculate', popular: 'Popular', subsidized: 'Subsidized' },
    filter: {
      title: 'Filter', clear: 'Clear', subsidized: 'Subsidized programs', bank: 'Bank', maxRate: 'Rate (up to)', propertyType: 'Property type',
      sort: 'Sort', sortPopular: 'Popular', sortRate: 'Lowest rate', sortMonthly: 'Lowest payment', sortRating: 'Rating', results: '{count} programs', empty: 'No matching programs',
    },
    propType: { NEW: 'New building', SECONDARY: 'Secondary', CONSTRUCTION: 'Under construction' },
    facts: { maxTerm: 'Maximum term', maxAmount: 'Maximum amount' },
    apply: {
      cta: 'Apply', loginCta: 'Sign in & apply', title: 'Mortgage application', subtitle: '{bank} will contact you', name: 'Your name', submit: 'Submit', sending: 'Sending…',
      done: 'Application sent', doneTitle: 'Application received', doneMsg: 'The bank will contact you shortly.', myApps: 'My applications',
    },
    myApps: {
      title: 'My applications', subtitle: 'Status of your mortgage applications', loginNeeded: 'Sign in to see your applications', login: 'Sign in',
      empty: 'No applications yet', emptyCta: 'Choose a mortgage', generic: 'Mortgage application', price: 'Property price',
      status: { NEW: 'New', CONTACTED: 'Contacted', APPROVED: 'Approved', FUNDED: 'Funded', REJECTED: 'Rejected' },
    },
    attach: { title: 'Buy this home with a mortgage', text: 'Calculate the payment and apply to a bank.', cta: 'Calculate mortgage' },
  },
};

const NAV = { uz: 'Ipoteka', ru: 'Ипотека', en: 'Mortgage' };

for (const [lang, file] of Object.entries(FILES)) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  json.ipoteka = NS[lang];
  if (json.nav && typeof json.nav === 'object') json.nav.mortgage = NAV[lang];
  writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`[${lang}] ipoteka ns + nav.mortgage yozildi`);
}
