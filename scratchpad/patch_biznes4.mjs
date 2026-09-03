import fs from 'node:fs';
const dir = 'apps/web/src/messages';

const add = {
  uz: {
    insType: { OSAGO: 'OSAGO', KASKO: 'KASKO', TRAVEL: 'Sayohat', PROPERTY: 'Mol-mulk', ACCIDENT: 'Baxtsiz hodisa', HEALTH: 'Tibbiy (VMD)' },
    products: {
      ins: {
        title: 'Sug‘urta mahsulotlari', addProduct: 'Mahsulot qo‘shish',
        liveHint: 'Qo‘shgan mahsulotingiz darrov /sugurta sahifasida va kalkulyatorda mijozlarga ko‘rinadi.',
        noBrand: 'Avval sug‘urta brendingizni yarating — keyin mahsulot qo‘shasiz.',
        createBrand: 'Brend yaratish', brandPh: 'Sug‘urta kompaniyasi nomi', brandCreated: 'Brend yaratildi',
        productLive: 'Mahsulot jonli efirga chiqdi', brand: 'Brend', type: 'Sug‘urta turi',
        name: 'Mahsulot nomi', namePh: 'Masalan: OSAGO Standart', priceFrom: 'Narx (dan, so‘m)',
        coverageFrom: 'Qoplama (dan, so‘m)', basePremium: 'Bazaviy premiya (so‘m)', optional: 'ixtiyoriy',
        noProduct: 'Hali mahsulot yo‘q. Birinchisini qo‘shing.', deleteConfirm: 'Bu mahsulotni o‘chirasizmi?',
      },
      nasiya: {
        title: 'Nasiya (bo‘lib to‘lash)', add: 'Provayder qo‘shish',
        liveHint: 'Qo‘shgan provayderingiz darrov /nasiya sahifasida taqqoslashda ko‘rinadi.',
        name: 'Provayder nomi', namePh: 'Masalan: MyPay Nasiya',
        minAmount: 'Min summa (so‘m)', maxAmount: 'Maks summa (so‘m)',
        terms: 'Muddat va ustama', termsHint: 'Har muddat uchun ustama foizini kiriting (bo‘sh = mavjud emas). Masalan 3 oy = 0%.',
        live: 'Provayder jonli efirga chiqdi', empty: 'Hali provayder yo‘q. Birinchisini qo‘shing.',
        deleteConfirm: 'Bu provayderni o‘chirasizmi?', fillRequired: 'Nom va kamida bitta muddat kiriting',
      },
    },
  },
  ru: {
    insType: { OSAGO: 'OSAGO', KASKO: 'КАСКО', TRAVEL: 'Путешествия', PROPERTY: 'Имущество', ACCIDENT: 'Несчастный случай', HEALTH: 'Медицинское (ДМС)' },
    products: {
      ins: {
        title: 'Страховые продукты', addProduct: 'Добавить продукт',
        liveHint: 'Добавленный продукт сразу появляется на /sugurta и в калькуляторе для клиентов.',
        noBrand: 'Сначала создайте страховой бренд — затем добавляйте продукты.',
        createBrand: 'Создать бренд', brandPh: 'Название страховой компании', brandCreated: 'Бренд создан',
        productLive: 'Продукт опубликован', brand: 'Бренд', type: 'Тип страхования',
        name: 'Название продукта', namePh: 'Например: OSAGO Стандарт', priceFrom: 'Цена (от, сум)',
        coverageFrom: 'Покрытие (от, сум)', basePremium: 'Базовая премия (сум)', optional: 'необязательно',
        noProduct: 'Пока нет продуктов. Добавьте первый.', deleteConfirm: 'Удалить этот продукт?',
      },
      nasiya: {
        title: 'Рассрочка', add: 'Добавить провайдера',
        liveHint: 'Добавленный провайдер сразу появляется в сравнении на /nasiya.',
        name: 'Название провайдера', namePh: 'Например: MyPay Рассрочка',
        minAmount: 'Мин сумма (сум)', maxAmount: 'Макс сумма (сум)',
        terms: 'Срок и наценка', termsHint: 'Укажите наценку в % для каждого срока (пусто = недоступно). Например 3 мес = 0%.',
        live: 'Провайдер опубликован', empty: 'Пока нет провайдеров. Добавьте первого.',
        deleteConfirm: 'Удалить этого провайдера?', fillRequired: 'Укажите название и хотя бы один срок',
      },
    },
  },
  en: {
    insType: { OSAGO: 'OSAGO', KASKO: 'KASKO', TRAVEL: 'Travel', PROPERTY: 'Property', ACCIDENT: 'Accident', HEALTH: 'Health (VMI)' },
    products: {
      ins: {
        title: 'Insurance products', addProduct: 'Add product',
        liveHint: 'A product you add appears instantly on /sugurta and in the calculator for customers.',
        noBrand: 'First create your insurance brand — then add products.',
        createBrand: 'Create brand', brandPh: 'Insurance company name', brandCreated: 'Brand created',
        productLive: 'Product is live', brand: 'Brand', type: 'Insurance type',
        name: 'Product name', namePh: 'e.g. OSAGO Standard', priceFrom: 'Price (from, UZS)',
        coverageFrom: 'Coverage (from, UZS)', basePremium: 'Base premium (UZS)', optional: 'optional',
        noProduct: 'No products yet. Add the first one.', deleteConfirm: 'Delete this product?',
      },
      nasiya: {
        title: 'Installment (BNPL)', add: 'Add provider',
        liveHint: 'A provider you add appears instantly in the comparison on /nasiya.',
        name: 'Provider name', namePh: 'e.g. MyPay Installment',
        minAmount: 'Min amount (UZS)', maxAmount: 'Max amount (UZS)',
        terms: 'Term and markup', termsHint: 'Enter markup % for each term (empty = unavailable). E.g. 3 months = 0%.',
        live: 'Provider is live', empty: 'No providers yet. Add the first one.',
        deleteConfirm: 'Delete this provider?', fillRequired: 'Enter a name and at least one term',
      },
    },
  },
};

function deepMerge(t, s) { for (const k in s) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) { t[k] = t[k] && typeof t[k] === 'object' ? t[k] : {}; deepMerge(t[k], s[k]); } else t[k] = s[k]; } }
for (const lang of ['uz', 'ru', 'en']) {
  const file = `${dir}/${lang}.json`;
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.biznes = json.biznes || {};
  deepMerge(json.biznes, add[lang]);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  console.log(`✓ ${lang}`);
}
