import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/**
 * Lifecycle avtomatizatsiya — retention dvigateli (cron).
 *
 * Idempotentlik `booking.remindedAt` / `reviewRequestedAt` orqali (bir marta
 * jo'natiladi). Barcha jo'natishlar best-effort (NotificationsService ichida
 * try/catch). Vaqt UTC (slotStart UTC saqlanadi) — to'g'ridan-to'g'ri Date math.
 *
 * SCHEDULER_DISABLED=1 bo'lsa umuman ishlamaydi (masalan ko'p-instansiyada
 * faqat bittasida yoqish uchun).
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger('Scheduler');
  private readonly disabled = process.env.SCHEDULER_DISABLED === '1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Har 15 daqiqada — uchrashuvga ~2 soat qolganda eslatma. */
  @Cron('*/15 * * * *')
  async remindUpcoming(): Promise<void> {
    if (this.disabled) return;
    const now = new Date();
    const soon = new Date(now.getTime() + 2 * HOUR);
    const due = await this.prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        remindedAt: null,
        slotStart: { gt: now, lte: soon },
      },
      select: { id: true },
      take: 200,
    });
    if (due.length === 0) return;
    for (const b of due) {
      await this.notifications.bookingReminder(b.id);
      await this.prisma.booking.update({ where: { id: b.id }, data: { remindedAt: new Date() } });
    }
    this.logger.log(`Bron eslatmasi: ${due.length} ta jo'natildi`);
  }

  /** Har 30 daqiqada — tashrifdan ~2 soat o'tgach sharh so'rovi (72 soatgacha). */
  @Cron('5,35 * * * *')
  async requestReviews(): Promise<void> {
    if (this.disabled) return;
    const now = new Date();
    const passed = new Date(now.getTime() - 2 * HOUR);
    const notTooOld = new Date(now.getTime() - 72 * HOUR);
    const due = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        reviewRequestedAt: null,
        slotEnd: { lt: passed, gt: notTooOld },
        review: { is: null },
      },
      select: { id: true },
      take: 200,
    });
    if (due.length === 0) return;
    for (const b of due) {
      await this.notifications.reviewRequest(b.id);
      await this.prisma.booking.update({ where: { id: b.id }, data: { reviewRequestedAt: new Date() } });
    }
    this.logger.log(`Sharh so'rovi: ${due.length} ta jo'natildi`);
  }

  /** Har 20 daqiqada — 60 daqiqadan oshgan to'lanmagan invoice'larni FAILED qiladi. */
  @Cron('*/20 * * * *')
  async expireStalePending(): Promise<void> {
    if (this.disabled) return;
    const cutoff = new Date(Date.now() - 60 * MIN);
    const res = await this.prisma.payment.updateMany({
      where: { status: 'PENDING', createdAt: { lt: cutoff } },
      data: { status: 'FAILED' },
    });
    if (res.count > 0) this.logger.log(`Eskirgan invoice: ${res.count} ta FAILED qilindi`);
  }
}
