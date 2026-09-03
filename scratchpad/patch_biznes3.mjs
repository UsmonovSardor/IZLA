import fs from 'node:fs';
const dir = 'apps/web/src/messages';

const add = {
  uz: {
    billing: {
      invoiceCreated: 'Hisob-faktura yaratildi — to‘lang',
      paidOk: 'To‘lov qabul qilindi',
      simDone: 'Simulyatsiya qo‘llandi',
      freeActive: 'Bepul tarif — to‘lov talab qilinmaydi',
      renewsOn: 'Yangilanadi:',
      expiredOn: 'Muddat tugadi:',
      graceHint: 'Obuna muddati tugadi. Grace davri davom etmoqda — to‘lang, aks holda mahsulotlar yashiriladi.',
      suspendedHint: 'Obuna neaktiv. Mahsulotlaringiz platformada yashirilgan, lekin barcha ma’lumot saqlangan. To‘lasangiz darrov tiklanadi.',
      openInvoice: 'To‘lanmagan hisob-faktura',
      due: 'muddat:',
      payDemo: 'To‘lash (demo)',
      invoicesTitle: 'Hisob-fakturalar tarixi',
      invStatus: { OPEN: 'Kutilmoqda', PAID: 'To‘langan', VOID: 'Bekor', DRAFT: 'Qoralama' },
      demoTitle: 'Demo: lifecycle sinovi',
      demoHint: 'Muddatni surib, avtomatik ketma-ketlikni sinang: ogohlantirish → grace → neaktiv. Real to‘lovda ham xuddi shunday ishlaydi.',
      simDay: '{d} kun',
      status: { ACTIVE: 'Faol', TRIALING: 'Sinov', PAST_DUE: 'To‘lov kutilmoqda', SUSPENDED: 'Neaktiv', CANCELLED: 'Bekor qilingan' },
    },
  },
  ru: {
    billing: {
      invoiceCreated: 'Счёт создан — оплатите',
      paidOk: 'Оплата принята',
      simDone: 'Симуляция применена',
      freeActive: 'Бесплатный тариф — оплата не требуется',
      renewsOn: 'Продлится:',
      expiredOn: 'Срок истёк:',
      graceHint: 'Срок подписки истёк. Идёт grace-период — оплатите, иначе продукты будут скрыты.',
      suspendedHint: 'Подписка неактивна. Ваши продукты скрыты на платформе, но все данные сохранены. После оплаты всё восстановится мгновенно.',
      openInvoice: 'Неоплаченный счёт',
      due: 'до:',
      payDemo: 'Оплатить (демо)',
      invoicesTitle: 'История счетов',
      invStatus: { OPEN: 'Ожидает', PAID: 'Оплачен', VOID: 'Отменён', DRAFT: 'Черновик' },
      demoTitle: 'Демо: тест жизненного цикла',
      demoHint: 'Сдвиньте срок и проверьте автоматику: напоминание → grace → неактивно. С реальной оплатой работает так же.',
      simDay: '{d} дн',
      status: { ACTIVE: 'Активна', TRIALING: 'Пробный', PAST_DUE: 'Ожидает оплаты', SUSPENDED: 'Неактивна', CANCELLED: 'Отменена' },
    },
  },
  en: {
    billing: {
      invoiceCreated: 'Invoice created — please pay',
      paidOk: 'Payment received',
      simDone: 'Simulation applied',
      freeActive: 'Free plan — no payment required',
      renewsOn: 'Renews:',
      expiredOn: 'Expired:',
      graceHint: 'Your subscription has expired. Grace period is running — pay now, otherwise products will be hidden.',
      suspendedHint: 'Subscription inactive. Your products are hidden on the platform, but all data is preserved. Paying restores everything instantly.',
      openInvoice: 'Unpaid invoice',
      due: 'due:',
      payDemo: 'Pay (demo)',
      invoicesTitle: 'Invoice history',
      invStatus: { OPEN: 'Pending', PAID: 'Paid', VOID: 'Void', DRAFT: 'Draft' },
      demoTitle: 'Demo: lifecycle test',
      demoHint: 'Shift the due date and test the automation: reminder → grace → suspended. Works the same with real payment.',
      simDay: '{d} days',
      status: { ACTIVE: 'Active', TRIALING: 'Trial', PAST_DUE: 'Payment due', SUSPENDED: 'Suspended', CANCELLED: 'Cancelled' },
    },
  },
};

function deepMerge(t, s) {
  for (const k in s) {
    if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { t[k] = t[k] && typeof t[k] === 'object' ? t[k] : {}; deepMerge(t[k], s[k]); }
    else t[k] = s[k];
  }
}
for (const lang of ['uz', 'ru', 'en']) {
  const file = `${dir}/${lang}.json`;
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.biznes = json.biznes || {};
  deepMerge(json.biznes, add[lang]);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  console.log(`✓ ${lang}`);
}
