/**
 * Payme Merchant API xato kodlari (rasmiy spetsifikatsiya).
 * https://developer.help.paycom.uz/protokol-merchant-api/oshibki
 *
 * JSON-RPC javobida `error: { code, message: {ru,uz,en}, data }` sifatida qaytadi.
 * HTTP status har doim 200.
 */

export interface PaymeLocalized {
  ru: string;
  uz: string;
  en: string;
}

export class PaymeError extends Error {
  constructor(
    public readonly code: number,
    public readonly localized: PaymeLocalized,
    public readonly data?: string,
  ) {
    super(localized.en);
  }
}

const L = (ru: string, uz: string, en: string): PaymeLocalized => ({ ru, uz, en });

/** -32504: yetarli huquq yo'q (Basic-auth muvaffaqiyatsiz). */
export const invalidAuth = () =>
  new PaymeError(-32504, L('Недостаточно привилегий', 'Ruxsat yetarli emas', 'Insufficient privileges'));

/** -32700 / -32600 / -32601: JSON-RPC parse / so'rov / metod xatosi. */
export const methodNotFound = (method?: string) =>
  new PaymeError(-32601, L('Метод не найден', 'Metod topilmadi', 'Method not found'), method);

/** -31050..-31099: hisob (order) topilmadi / noto'g'ri. `data` — xato maydon nomi. */
export const orderNotFound = (field = 'order_id') =>
  new PaymeError(-31050, L('Заказ не найден', 'Buyurtma topilmadi', 'Order not found'), field);

/** -31001: summa noto'g'ri. */
export const invalidAmount = () =>
  new PaymeError(-31001, L('Неверная сумма', 'Summa noto‘g‘ri', 'Invalid amount'));

/** -31008: operatsiyani bajarib bo'lmaydi (holat mos emas). */
export const cannotPerform = () =>
  new PaymeError(-31008, L('Невозможно выполнить операцию', 'Operatsiyani bajarib bo‘lmaydi', 'Unable to perform operation'));

/** -31003: tranzaksiya topilmadi. */
export const txnNotFound = () =>
  new PaymeError(-31003, L('Транзакция не найдена', 'Tranzaksiya topilmadi', 'Transaction not found'));

/** -31099: buyurtmaga to'lov qilib bo'lmaydi (masalan bekor qilingan bron). */
export const orderUnavailable = (field = 'order_id') =>
  new PaymeError(-31099, L('Заказ недоступен для оплаты', 'Buyurtma to‘lov uchun mavjud emas', 'Order is not available for payment'), field);
