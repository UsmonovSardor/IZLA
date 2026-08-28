import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Payment, PaymentProvider } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { env } from '../../config/env';
import { toTiyin } from './money';
import { commissionRateFor } from '../../common/plans';

// Checkout URL'i bor provayderlar
const CHECKOUT_PROVIDERS = ['PAYME', 'CLICK'] as const;
type CheckoutProvider = (typeof CHECKOUT_PROVIDERS)[number];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private webUrl(): string {
    return (env.WEB_URL || env.CORS_ORIGIN.split(',')[0] || 'http://localhost:3000').replace(/\/$/, '');
  }

  private returnUrl(): string {
    return `${this.webUrl()}/bron`;
  }

  /** Bron uchun invoice yaratadi (yoki mavjudini qaytaradi) va checkout URL beradi. */
  async createInvoice(userId: string, dto: { bookingId: string; provider: CheckoutProvider }) {
    if (!CHECKOUT_PROVIDERS.includes(dto.provider)) {
      throw new BadRequestException('Provayder qo‘llab-quvvatlanmaydi');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { service: { select: { name: true, price: true } } },
    });
    if (!booking || booking.userId !== userId) throw new NotFoundException('Bron topilmadi');
    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
      throw new BadRequestException('Bu bron uchun to‘lov qilib bo‘lmaydi');
    }
    if (Number(booking.service.price) <= 0) {
      throw new BadRequestException('Bu xizmat bepul — to‘lov talab qilinmaydi');
    }

    let payment = await this.prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (payment?.status === 'PAID') throw new ConflictException('Bu bron allaqachon to‘langan');

    if (payment) {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { provider: dto.provider, status: 'PENDING' },
      });
    } else {
      payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId,
          amount: booking.service.price,
          provider: dto.provider,
          status: 'PENDING',
        },
      });
    }

    return {
      ...this.publicView(payment),
      checkoutUrl: this.checkoutUrl(payment, dto.provider),
    };
  }

  /** To'lov holati (egasi tekshiriladi). */
  async getById(userId: string, id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.userId !== userId) throw new NotFoundException('To‘lov topilmadi');
    return this.publicView(payment);
  }

  /** Bronga bog'langan to'lov (bo'lsa). */
  async getByBooking(userId: string, bookingId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) return null;
    if (payment.userId !== userId) throw new NotFoundException('To‘lov topilmadi');
    return this.publicView(payment);
  }

  // ---------- provayder callback'lari chaqiradigan settle metodlari ----------

  /** To'lov muvaffaqiyatli — invoice PAID, bron avto-tasdiq (oldindan to'lov). */
  async markPaid(paymentId: string, provider: PaymentProvider, externalId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', paidAt: new Date(), provider, externalId, escrowState: 'HELD' },
      });
      if (payment.bookingId) {
        await tx.booking.updateMany({
          where: { id: payment.bookingId, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });
        // Platforma take-rate: vendor tarifiga qarab Izla komissiyasini hisoblab yozamiz.
        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
          select: { vendor: { select: { plan: true } } },
        });
        const rate = commissionRateFor(booking?.vendor?.plan);
        const amount = Number(payment.amount);
        const commission = Math.round(amount * rate);
        await tx.payment.update({
          where: { id: paymentId },
          data: { commissionAmount: commission, netAmount: amount - commission },
        });
      }
    });
    // Best-effort bildirishnoma (callback javobini bloklamaydi)
    void this.notifications.paymentPaid(paymentId);
  }

  /** To'lov bekor qilindi (to'lanmagan holatda). */
  async markFailed(paymentId: string) {
    await this.prisma.payment.updateMany({
      where: { id: paymentId, status: { not: 'PAID' } },
      data: { status: 'FAILED' },
    });
  }

  /** To'langandan keyin bekor (refund) — invoice REFUNDED, bron bekor. */
  async markRefunded(paymentId: string, provider: PaymentProvider, externalId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED', provider, externalId, escrowState: 'REFUNDED' },
      });
      if (payment.bookingId) {
        await tx.booking.updateMany({
          where: { id: payment.bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
          data: { status: 'CANCELLED' },
        });
      }
    });
    void this.notifications.paymentRefunded(paymentId);
  }

  // ---------- checkout URL quruvchi ----------
  checkoutUrl(payment: Payment, provider: CheckoutProvider): string {
    return provider === 'PAYME' ? this.paymeUrl(payment) : this.clickUrl(payment);
  }

  /** Payme: base64(`m=..;ac.order_id=..;a=<tiyin>;c=<return>;l=uz`) checkout URL. */
  private paymeUrl(payment: Payment): string {
    const parts = [
      `m=${env.PAYME_MERCHANT_ID}`,
      `ac.order_id=${payment.id}`,
      `a=${toTiyin(payment.amount)}`,
      `c=${this.returnUrl()}`,
      'l=uz',
    ].join(';');
    const encoded = Buffer.from(parts, 'utf8').toString('base64');
    return `${env.PAYME_CHECKOUT_URL.replace(/\/$/, '')}/${encoded}`;
  }

  /** Click: my.click.uz/services/pay so'rov parametrlari (summa so'mda). */
  private clickUrl(payment: Payment): string {
    const qs = new URLSearchParams({
      service_id: env.CLICK_SERVICE_ID,
      merchant_id: env.CLICK_MERCHANT_ID,
      amount: String(payment.amount),
      transaction_param: payment.id,
      return_url: this.returnUrl(),
    });
    return `${env.CLICK_CHECKOUT_URL}?${qs.toString()}`;
  }

  private publicView(p: Payment) {
    return {
      id: p.id,
      bookingId: p.bookingId,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    };
  }
}
