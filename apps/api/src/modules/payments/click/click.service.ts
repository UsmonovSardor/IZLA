import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { env } from '../../../config/env';
import { sumMatches } from '../money';

const PROVIDER = 'CLICK' as const;

// Click holatlari (PaymentTransaction.state ichida)
const PREPARED = 1;
const CONFIRMED = 2;
const CANCELLED = -9;

// Click SHOP API xato kodlari
const ERR = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  BAD_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TXN_NOT_FOUND: -6,
  BAD_REQUEST: -8,
  CANCELLED: -9,
} as const;

interface ClickReq {
  click_trans_id?: string;
  service_id?: string;
  click_paydoc_id?: string;
  merchant_trans_id?: string; // = Payment.id
  merchant_prepare_id?: string;
  amount?: string;
  action?: string; // '0' prepare, '1' complete
  error?: string;
  error_note?: string;
  sign_time?: string;
  sign_string?: string;
}

/**
 * Click Merchant (SHOP) API — Prepare/Complete.
 * Summa **so'm**da keladi. Imzo — md5 konkatenatsiyasi.
 */
@Injectable()
export class ClickService {
  private readonly logger = new Logger('Click');

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  get enabled(): boolean {
    return Boolean(env.CLICK_SECRET_KEY && env.CLICK_SERVICE_ID);
  }

  /** Prepare bosqichi imzosi. */
  private prepareSign(b: ClickReq): string {
    return this.md5(
      `${b.click_trans_id}${b.service_id}${env.CLICK_SECRET_KEY}${b.merchant_trans_id}${b.amount}${b.action}${b.sign_time}`,
    );
  }

  /** Complete bosqichi imzosi (merchant_prepare_id qo'shiladi). */
  private completeSign(b: ClickReq): string {
    return this.md5(
      `${b.click_trans_id}${b.service_id}${env.CLICK_SECRET_KEY}${b.merchant_trans_id}${b.merchant_prepare_id}${b.amount}${b.action}${b.sign_time}`,
    );
  }

  private md5(s: string): string {
    return createHash('md5').update(s).digest('hex');
  }

  private reply(b: ClickReq, error: number, note: string, extra: Record<string, unknown> = {}) {
    return {
      click_trans_id: b.click_trans_id,
      merchant_trans_id: b.merchant_trans_id,
      error,
      error_note: note,
      ...extra,
    };
  }

  // ---------- PREPARE (action=0) ----------
  async prepare(b: ClickReq) {
    if (!this.enabled) return this.reply(b, ERR.BAD_REQUEST, 'Click sozlanmagan');
    if (b.sign_string !== this.prepareSign(b)) return this.reply(b, ERR.SIGN_FAILED, 'SIGN CHECK FAILED');
    if (b.service_id !== env.CLICK_SERVICE_ID) return this.reply(b, ERR.SIGN_FAILED, 'SIGN CHECK FAILED');

    const payment = await this.prisma.payment.findUnique({ where: { id: b.merchant_trans_id } });
    if (!payment) return this.reply(b, ERR.ORDER_NOT_FOUND, 'Order not found');
    if (payment.status === 'PAID') return this.reply(b, ERR.ALREADY_PAID, 'Already paid');
    if (payment.status === 'REFUNDED') return this.reply(b, ERR.CANCELLED, 'Order cancelled');
    if (!sumMatches(payment.amount, b.amount ?? '0')) return this.reply(b, ERR.BAD_AMOUNT, 'Incorrect amount');

    // Idempotent: mavjud tranzaksiyani qayta ishlatamiz
    const txn = await this.prisma.paymentTransaction.upsert({
      where: { provider_providerTxnId: { provider: PROVIDER, providerTxnId: b.click_trans_id! } },
      update: {},
      create: {
        paymentId: payment.id,
        provider: PROVIDER,
        providerTxnId: b.click_trans_id!,
        state: PREPARED,
        amount: payment.amount,
        createTime: new Date(),
        raw: b as unknown as Prisma.InputJsonValue,
      },
    });
    if (payment.provider !== PROVIDER) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { provider: PROVIDER } });
    }

    return this.reply(b, ERR.SUCCESS, 'Success', { merchant_prepare_id: txn.id });
  }

  // ---------- COMPLETE (action=1) ----------
  async complete(b: ClickReq) {
    if (!this.enabled) return this.reply(b, ERR.BAD_REQUEST, 'Click sozlanmagan');
    if (b.sign_string !== this.completeSign(b)) return this.reply(b, ERR.SIGN_FAILED, 'SIGN CHECK FAILED');

    const payment = await this.prisma.payment.findUnique({ where: { id: b.merchant_trans_id } });
    if (!payment) return this.reply(b, ERR.ORDER_NOT_FOUND, 'Order not found');

    const txn = await this.prisma.paymentTransaction.findFirst({
      where: {
        id: b.merchant_prepare_id,
        provider: PROVIDER,
        providerTxnId: b.click_trans_id,
        paymentId: payment.id,
      },
    });
    if (!txn) return this.reply(b, ERR.TXN_NOT_FOUND, 'Transaction not found');
    if (txn.state === CANCELLED) return this.reply(b, ERR.CANCELLED, 'Transaction cancelled');
    if (txn.state === CONFIRMED || payment.status === 'PAID') {
      return this.reply(b, ERR.ALREADY_PAID, 'Already paid', { merchant_confirm_id: txn.id });
    }
    if (!sumMatches(payment.amount, b.amount ?? '0')) return this.reply(b, ERR.BAD_AMOUNT, 'Incorrect amount');

    // Click tomonda foydalanuvchi bekor qilgan bo'lsa (error < 0)
    if (b.error != null && Number(b.error) < 0) {
      await this.prisma.paymentTransaction.update({
        where: { id: txn.id },
        data: { state: CANCELLED, cancelTime: new Date(), reason: Number(b.error) },
      });
      await this.payments.markFailed(payment.id);
      return this.reply(b, ERR.CANCELLED, 'Transaction cancelled');
    }

    await this.prisma.paymentTransaction.update({
      where: { id: txn.id },
      data: { state: CONFIRMED, performTime: new Date() },
    });
    await this.payments.markPaid(payment.id, PROVIDER, txn.providerTxnId);
    return this.reply(b, ERR.SUCCESS, 'Success', { merchant_confirm_id: txn.id });
  }
}
