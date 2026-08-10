import { Prisma } from '@izla/db';

/**
 * Pul birliklari:
 *  - Bazada `Payment.amount` — so'm (UZS), Decimal(12,2).
 *  - Payme summani **tiyin**da yuboradi (1 so'm = 100 tiyin).
 *  - Click summani **so'm**da yuboradi (kasrli bo'lishi mumkin).
 */

/** Decimal so'mni butun tiyinga (Payme). */
export function toTiyin(sum: Prisma.Decimal | string | number): bigint {
  return BigInt(new Prisma.Decimal(sum).times(100).toFixed(0));
}

/** Payme yuborgan tiyin summasi invoice summasiga (tiyin) mos keladimi. */
export function tiyinMatches(sum: Prisma.Decimal | string | number, tiyin: number | string): boolean {
  return toTiyin(sum) === BigInt(String(tiyin));
}

/** Click yuborgan so'm summasi invoice summasiga mos keladimi (tiyin aniqligida solishtiramiz). */
export function sumMatches(sum: Prisma.Decimal | string | number, clickAmount: number | string): boolean {
  return toTiyin(sum) === toTiyin(String(clickAmount));
}

/** Date → ms epoch (Payme create_time/perform_time/cancel_time formati). */
export function toMs(d: Date | null | undefined): number {
  return d ? d.getTime() : 0;
}
