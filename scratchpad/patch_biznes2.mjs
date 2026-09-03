import fs from 'node:fs';
const dir = 'apps/web/src/messages';

const add = {
  uz: {
    common: { add: 'Qo‘shish', cancel: 'Bekor qilish', delete: 'O‘chirish' },
    products: {
      otherChannels: 'Boshqa kanallar',
      readonly: 'Bu mahsulotlar Izla jamoasi tomonidan ulangan. Tahrirlash uchun bog‘laning.',
      mortgage: {
        title: 'Ipoteka dasturlari',
        viewLive: 'Jonli ko‘rish',
        addProgram: 'Dastur qo‘shish',
        liveHint: 'Qo‘shgan dasturingiz darrov /ipoteka sahifasida va kalkulyatorda mijozlarga ko‘rinadi.',
        noBank: 'Avval bank brendingizni yarating — keyin ipoteka dasturlari qo‘shasiz.',
        createBank: 'Bank yaratish',
        bankNamePh: 'Bank nomi',
        bankCreated: 'Bank yaratildi',
        programLive: 'Dastur jonli efirga chiqdi',
        fillRequired: 'Majburiy maydonlarni to‘ldiring',
        deleteConfirm: 'Bu dasturni o‘chirishni tasdiqlaysizmi?',
        deleted: 'Dastur o‘chirildi',
        selectBank: 'Bank',
        programName: 'Dastur nomi',
        programNamePh: 'Masalan: Yangi uy-joy ipotekasi',
        rate: 'Yillik stavka',
        term: 'Maksimal muddat (oy)',
        down: 'Boshlang‘ich to‘lov',
        maxAmount: 'Maksimal summa (so‘m)',
        publish: 'E’lon qilish',
        noProgram: 'Hali dastur yo‘q. Birinchisini qo‘shing.',
      },
    },
  },
  ru: {
    common: { add: 'Добавить', cancel: 'Отмена', delete: 'Удалить' },
    products: {
      otherChannels: 'Другие каналы',
      readonly: 'Эти продукты подключены командой Izla. Свяжитесь для редактирования.',
      mortgage: {
        title: 'Ипотечные программы',
        viewLive: 'Смотреть вживую',
        addProgram: 'Добавить программу',
        liveHint: 'Добавленная программа сразу появляется на /ipoteka и в калькуляторе для клиентов.',
        noBank: 'Сначала создайте бренд банка — затем добавляйте ипотечные программы.',
        createBank: 'Создать банк',
        bankNamePh: 'Название банка',
        bankCreated: 'Банк создан',
        programLive: 'Программа опубликована',
        fillRequired: 'Заполните обязательные поля',
        deleteConfirm: 'Удалить эту программу?',
        deleted: 'Программа удалена',
        selectBank: 'Банк',
        programName: 'Название программы',
        programNamePh: 'Например: Ипотека на новостройку',
        rate: 'Годовая ставка',
        term: 'Макс. срок (мес)',
        down: 'Первоначальный взнос',
        maxAmount: 'Макс. сумма (сум)',
        publish: 'Опубликовать',
        noProgram: 'Пока нет программ. Добавьте первую.',
      },
    },
  },
  en: {
    common: { add: 'Add', cancel: 'Cancel', delete: 'Delete' },
    products: {
      otherChannels: 'Other channels',
      readonly: 'These products were connected by the Izla team. Contact us to edit.',
      mortgage: {
        title: 'Mortgage programs',
        viewLive: 'View live',
        addProgram: 'Add program',
        liveHint: 'A program you add appears instantly on /ipoteka and in the calculator for customers.',
        noBank: 'First create your bank brand — then add mortgage programs.',
        createBank: 'Create bank',
        bankNamePh: 'Bank name',
        bankCreated: 'Bank created',
        programLive: 'Program is live',
        fillRequired: 'Fill in the required fields',
        deleteConfirm: 'Delete this program?',
        deleted: 'Program deleted',
        selectBank: 'Bank',
        programName: 'Program name',
        programNamePh: 'e.g. New housing mortgage',
        rate: 'Annual rate',
        term: 'Max term (months)',
        down: 'Down payment',
        maxAmount: 'Max amount (UZS)',
        publish: 'Publish',
        noProgram: 'No programs yet. Add the first one.',
      },
    },
  },
};

function deepMerge(target, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {};
      deepMerge(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
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
