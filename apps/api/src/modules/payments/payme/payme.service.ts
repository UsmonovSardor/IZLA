import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { env } from '../../../config/env';
import { toMs, tiyinMatches, toTiyin } from '../money';
import {
  PaymeError,
  cannotPerform,
  invalidAmount,
  methodNotFound,
  orderNotFound,
  orderUnavailable,
  txnNotFound,
} from './payme.errors';

const PROVIDER = 'PAYME' as const;

// Payme davomiyliklari (spec bo'yicha)
const CREATE_STATE = 1;
const PERFORM_STATE = 2;
const CANCELLED_STATE = -1; // 1-holatdan bekor
const CANCELLED_AFTER_PERFORM = -2; // 2-holatdan bekor
const TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 soat: pending tranzaksiya muddati

interface JsonRpcReq {
  method?: string;
  params?: any;
  id?: number | string | null;
}

/**
 * Payme (Paycom) Merchant API — JSON-RPC 2.0 dispatcher.
 * Hisob (account) kaliti: `order_id` = Payment.id.
 * Summa Payme tomonidan **tiyin**da keladi.
 */
@Injectable()
export class PaymeService {
  private readonly logger = new Logger('Payme');

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  get enabled(): boolean {
    return Boolean(env.PAYME_MERCHANT_KEY);
  }

  /** Endpoint Basic-auth: `Basic base64("Paycom:" + MERCHANT_KEY)`. */
  checkAuth(header?: string): boolean {
    if (!this.enabled) return false;
    if (!header?.startsWith('Basic ')) return false;
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const key = idx >= 0 ? decoded.slice(idx + 1) : '';
    return key === env.PAYME_MERCHANT_KEY;
  }

  /** JSON-RPC so'rovni qayta ishlaydi. Har doim { jsonrpc, id, result|error } qaytaradi. */
  async handle(req: JsonRpcReq): Promise<Record<string, unknown>> {
    const id = req.id ?? null;
    try {
      const result = await this.dispatch(req.method ?? '', req.params ?? {});
      return { jsonrpc: '2.0', id, result };
    } catch (e) {
      const err =
        e instanceof PaymeError
          ? e
          : (this.logger.error(`Payme internal: ${(e as Error).message}`),
            new PaymeError(-32400, { ru: 'Системная ошибка', uz: 'Tizim xatosi', en: 'System error' }));
      return {
        jsonrpc: '2.0',
        id,
        error: { code: err.code, message: err.localized, data: err.data },
      };
    }
  }

  private dispatch(method: string, params: any): Promise<unknown> {
    switch (method) {
      case 'CheckPerformTransaction':
        return this.checkPerform(params);
      case 'CreateTransaction':
        return this.createTransaction(params);
      case 'PerformTransaction':
        return this.performTransaction(params);
      case 'CancelTransaction':
        return this.cancelTransaction(params);
      case 'CheckTransaction':
        return this.checkTransaction(params);
      case 'GetStatement':
        return this.getStatement(params);
      default:
        throw methodNotFound(method);
    }
  }

  // --- hisobni topish + validatsiya ---
  private async findPayableOrThrow(params: any) {
    const orderId: string | undefined = params?.account?.order_id;
    if (!orderId) throw orderNotFound('order_id');
    const payment = await this.prisma.payment.findUnique({ where: { id: orderId } });
    if (!payment) throw orderNotFound('order_id');
    if (params?.amount != null && !tiyinMatches(payment.amount, params.amount)) {
      throw invalidAmount();
    }
    return payment;
  }

  // CheckPerformTransaction
  private async checkPerform(params: any) {
    const payment = await this.findPayableOrThrow(params);
    if (payment.status === 'PAID' || payment.status === 'REFUNDED') {
      throw orderUnavailable('order_id');
    }
    // Boshqa faol Payme tranzaksiyasi bo'lsa — jarayonda
    const active = await this.prisma.paymentTransaction.findFirst({
      where: { paymentId: payment.id, provider: PROVIDER, state: { in: [CREATE_STATE, PERFORM_STATE] } },
    });
    if (active) throw orderUnavailable('order_id');
    return { allow: true };
  }

  // CreateTransaction
  private async createTransaction(params: any) {
    const paymeId: string = params?.id;
    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { provider_providerTxnId: { provider: PROVIDER, providerTxnId: paymeId } },
    });
    if (existing) {
      if (existing.state !== CREATE_STATE) throw cannotPerform();
      // Muddati o'tgan pending — bekor holatida qaytariladi
      if (Date.now() - toMs(existing.createTime) > TIMEOUT_MS) {
        const cancelled = await this.prisma.paymentTransaction.update({
          where: { id: existing.id },
          data: { state: CANCELLED_STATE, cancelTime: new Date(), reason: 4 },
        });
        return { create_time: toMs(cancelled.createTime), transaction: cancelled.id, state: cancelled.state };
      }
      return { create_time: toMs(existing.createTime), transaction: existing.id, state: existing.state };
    }

    const payment = await this.findPayableOrThrow(params);
    await this.checkPerform(params); // payable + amount + no active txn

    const txn = await this.prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        provider: PROVIDER,
        providerTxnId: paymeId,
        state: CREATE_STATE,
        amount: payment.amount,
        createTime: params?.time ? new Date(Number(params.time)) : new Date(),
        raw: params as Prisma.InputJsonValue,
      },
    });
    // Provayderni belgilab qo'yamiz (status polling uchun)
    if (payment.provider !== PROVIDER) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { provider: PROVIDER } });
    }
    return { create_time: toMs(txn.createTime), transaction: txn.id, state: txn.state };
  }

  // PerformTransaction
  private async performTransaction(params: any) {
    const txn = await this.byPaymeId(params?.id);
    if (txn.state === PERFORM_STATE) {
      return { transaction: txn.id, perform_time: toMs(txn.performTime), state: PERFORM_STATE };
    }
    if (txn.state !== CREATE_STATE) throw cannotPerform();
    if (Date.now() - toMs(txn.createTime) > TIMEOUT_MS) throw cannotPerform();

    const now = new Date();
    const updated = await this.prisma.paymentTransaction.update({
      where: { id: txn.id },
      data: { state: PERFORM_STATE, performTime: now },
    });
    await this.payments.markPaid(txn.paymentId, PROVIDER, txn.providerTxnId);
    return { transaction: updated.id, perform_time: toMs(now), state: PERFORM_STATE };
  }

  // CancelTransaction
  private async cancelTransaction(params: any) {
    const txn = await this.byPaymeId(params?.id);
    const reason = params?.reason != null ? Number(params.reason) : null;

    if (txn.state === CANCELLED_STATE || txn.state === CANCELLED_AFTER_PERFORM) {
      return { transaction: txn.id, cancel_time: toMs(txn.cancelTime), state: txn.state };
    }

    const newState = txn.state === PERFORM_STATE ? CANCELLED_AFTER_PERFORM : CANCELLED_STATE;
    const now = new Date();
    const updated = await this.prisma.paymentTransaction.update({
      where: { id: txn.id },
      data: { state: newState, cancelTime: now, reason },
    });
    if (newState === CANCELLED_AFTER_PERFORM) {
      await this.payments.markRefunded(txn.paymentId, PROVIDER, txn.providerTxnId);
    } else {
      await this.payments.markFailed(txn.paymentId);
    }
    return { transaction: updated.id, cancel_time: toMs(now), state: newState };
  }

  // CheckTransaction
  private async checkTransaction(params: any) {
    const txn = await this.byPaymeId(params?.id);
    return {
      create_time: toMs(txn.createTime),
      perform_time: toMs(txn.performTime),
      cancel_time: toMs(txn.cancelTime),
      transaction: txn.id,
      state: txn.state,
      reason: txn.reason ?? null,
    };
  }

  // GetStatement
  private async getStatement(params: any) {
    const from = new Date(Number(params?.from ?? 0));
    const to = new Date(Number(params?.to ?? Date.now()));
    const txns = await this.prisma.paymentTransaction.findMany({
      where: { provider: PROVIDER, createTime: { gte: from, lte: to } },
      orderBy: { createTime: 'asc' },
    });
    return {
      transactions: txns.map((t) => ({
        id: t.providerTxnId,
        time: toMs(t.createTime),
        amount: Number(toTiyin(t.amount)),
        account: { order_id: t.paymentId },
        create_time: toMs(t.createTime),
        perform_time: toMs(t.performTime),
        cancel_time: toMs(t.cancelTime),
        transaction: t.id,
        state: t.state,
        reason: t.reason ?? null,
      })),
    };
  }

  private async byPaymeId(paymeId: string) {
    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { provider_providerTxnId: { provider: PROVIDER, providerTxnId: paymeId } },
    });
    if (!txn) throw txnNotFound();
    return txn;
  }
}
