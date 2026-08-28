import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { SmsService } from './sms.service';

const TZ = 'Asia/Tashkent';

function fmtMoney(amount: unknown): string {
  return `${new Intl.NumberFormat('ru-RU').format(Number(amount))} so‘m`;
}
function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: TZ,
  }).format(d);
}

/**
 * To'lov hodisalari bo'yicha foydalanuvchiga bildirishnoma (Telegram yoki SMS).
 * Kanal `user.phone` ga qarab tanlanadi: `tg:<id>` → Telegram, aks holda SMS.
 * Barcha jo'natishlar best-effort — chaqiruvchini hech qachon bloklamaydi.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly sms: SmsService,
  ) {}

  /** To'lov muvaffaqiyatli — bron tasdiqlandi. */
  async paymentPaid(paymentId: string): Promise<void> {
    const ctx = await this.load(paymentId);
    if (!ctx) return;
    const { user, serviceName, vendorName, when, amount } = ctx;

    const tgText =
      `✅ To‘lov qabul qilindi!\n\n` +
      `${serviceName} — ${vendorName}\n` +
      `🗓 ${when}\n💳 ${amount}\n\n` +
      `Broningiz tasdiqlandi. Rahmat! 🎉`;
    const smsText = `Izla.uz: ${amount} to'lov qabul qilindi. ${serviceName}, ${when}. Bron tasdiqlandi.`;

    await this.dispatch(user, 'payment_paid', tgText, smsText, { paymentId, amount });
  }

  /** To'lov qaytarildi — bron bekor qilindi. */
  async paymentRefunded(paymentId: string): Promise<void> {
    const ctx = await this.load(paymentId);
    if (!ctx) return;
    const { user, serviceName, vendorName, when, amount } = ctx;

    const tgText =
      `↩️ To‘lov qaytarildi.\n\n` +
      `${serviceName} — ${vendorName}\n🗓 ${when}\n💳 ${amount}\n\n` +
      `Bron bekor qilindi. Mablag‘ hisobingizga qaytariladi.`;
    const smsText = `Izla.uz: ${amount} qaytarildi. ${serviceName} broni bekor qilindi.`;

    await this.dispatch(user, 'payment_refunded', tgText, smsText, { paymentId, amount });
  }

  /**
   * Ko'chmas mulk lead'i yaratildi. Developer/rieltorga SMS (best-effort — telefon
   * bo'lsa; kalitsiz LOG rejimi) + xaridorga ilova ichida tasdiq. Best-effort.
   */
  async propertyLeadCreated(leadId: string): Promise<void> {
    try {
      const lead = await this.prisma.propertyLead.findUnique({
        where: { id: leadId },
        include: {
          property: { select: { title: true } },
          complex: { select: { name: true, developer: { select: { name: true, phone: true } } } },
        },
      });
      if (!lead) return;

      const objectName = lead.property?.title || lead.complex?.name || 'obyekt';
      const devPhone = lead.complex?.developer?.phone;

      // 1) Developer/rieltorga SMS (agar telefon bo'lsa)
      if (devPhone) {
        const smsText =
          `Izla.uz: "${objectName}" bo'yicha yangi murojaat. ` +
          `${lead.name}, tel: ${lead.phone}.` +
          (lead.message ? ` Izoh: ${lead.message.slice(0, 60)}` : '');
        try {
          await this.sms.send(devPhone, smsText);
        } catch (e) {
          this.logger.error(`Lead SMS xato: ${(e as Error).message}`);
        }
      } else {
        this.logger.log(`Lead ${leadId}: developer telefoni yo'q — SMS o'tkazildi`);
      }

      // 2) Xaridorga ilova ichida tasdiq
      await this.pushInApp(lead.userId, 'property_lead_sent', {
        title: 'Murojaatingiz yuborildi',
        body: `"${objectName}" bo'yicha so'rovingiz qabul qilindi. Tez orada bog'lanishadi.`,
        href: lead.propertyId ? `/uylar/${lead.propertyId}` : '/uylar',
      });
    } catch (e) {
      this.logger.error(`propertyLeadCreated xato: ${(e as Error).message}`);
    }
  }

  // --- Ilova ichidagi bildirishnomalar (bell markazi) ---

  /** Ilova ichida bildirishnoma yaratadi (PUSH kanal, darhol "sent"). Best-effort. */
  async pushInApp(userId: string, type: string, data: { title: string; body?: string; href?: string }): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId, channel: 'PUSH', type,
          payload: { title: data.title, body: data.body ?? '', href: data.href ?? '' } as Prisma.InputJsonObject,
          sentAt: new Date(),
        },
      });
    } catch (e) {
      this.logger.error(`In-app notif xato: ${(e as Error).message}`);
    }
  }

  /** Foydalanuvchining so'nggi bildirishnomalari (bell markazi uchun). */
  async list(userId: string) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return rows.map((n) => {
      const p = (n.payload ?? {}) as { title?: string; body?: string; href?: string; amount?: string };
      return {
        id: n.id,
        type: n.type,
        title: p.title ?? this.fallbackTitle(n.type),
        body: p.body ?? '',
        href: p.href ?? '',
        read: n.readAt != null,
        createdAt: n.createdAt,
      };
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async markRead(id: string, userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  private fallbackTitle(type: string): string {
    if (type === 'payment_paid') return "To'lov qabul qilindi";
    if (type === 'payment_refunded') return "To'lov qaytarildi";
    if (type === 'property_lead_sent') return 'Murojaatingiz yuborildi';
    return 'Bildirishnoma';
  }

  // --- ichki ---

  private async load(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            vendor: { select: { name: true } },
          },
        },
      },
    });
    if (!payment) return null;
    // Payment'da `user` relation yo'q (faqat userId) — alohida yuklaymiz
    const user = await this.prisma.user.findUnique({
      where: { id: payment.userId },
      select: { id: true, phone: true },
    });
    if (!user) return null;
    return {
      user,
      amount: fmtMoney(payment.amount),
      serviceName: payment.booking?.service.name ?? 'Xizmat',
      vendorName: payment.booking?.vendor.name ?? 'Izla',
      when: payment.booking ? fmtDateTime(payment.booking.slotStart) : '',
    };
  }

  private async dispatch(
    user: { id: string; phone: string },
    type: string,
    tgText: string,
    smsText: string,
    payload: Prisma.InputJsonObject,
  ) {
    try {
      if (user.phone.startsWith('tg:')) {
        const chatId = user.phone.slice(3);
        const res = await this.telegram.call('sendMessage', { chat_id: chatId, text: tgText });
        await this.record(user.id, 'TELEGRAM', type, payload, (res as { ok?: boolean })?.ok === true);
      } else {
        const ok = await this.sms.send(user.phone, smsText);
        await this.record(user.id, 'SMS', type, payload, ok);
      }
    } catch (e) {
      this.logger.error(`Bildirishnoma xato (${type}): ${(e as Error).message}`);
    }
  }

  private async record(
    userId: string,
    channel: 'TELEGRAM' | 'SMS',
    type: string,
    payload: Prisma.InputJsonObject,
    sent: boolean,
  ) {
    try {
      await this.prisma.notification.create({
        data: { userId, channel, type, payload, sentAt: sent ? new Date() : null },
      });
    } catch (e) {
      this.logger.error(`Notification yozib bo‘lmadi: ${(e as Error).message}`);
    }
  }
}
