import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import {
  generateSlots,
  isValidDateStr,
  tashkentDateStr,
  tashkentToUtc,
  type Hours,
} from './slots';
import { NotificationsService } from '../notifications/notifications.service';
import { CoinsService } from '../coins/coins.service';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'] as const;
const COINS_PER_BOOKING = 50;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly coins: CoinsService,
  ) {}

  /** Berilgan xizmat + sana uchun mavjud slotlar (ochiq/band). Ochiq (public). */
  async availability(serviceId: string, dateStr: string) {
    if (!isValidDateStr(dateStr)) {
      throw new BadRequestException('Sana YYYY-MM-DD formatida bo‘lishi kerak');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { vendor: { select: { id: true, name: true, hours: true } } },
    });
    if (!service || !service.active) throw new NotFoundException('Xizmat topilmadi');

    // O'sha kalendar kunidagi faol bronlar (staff bo'yicha, staff bo'lmasa vendor bo'yicha)
    const dayStart = tashkentToUtc(dateStr, 0);
    const dayEnd = tashkentToUtc(dateStr, 24 * 60);
    const existing = await this.prisma.booking.findMany({
      where: {
        vendorId: service.vendorId,
        ...(service.staffId ? { staffId: service.staffId } : {}),
        status: { in: [...ACTIVE_STATUSES] },
        slotStart: { gte: dayStart, lt: dayEnd },
      },
      select: { slotStart: true, slotEnd: true },
    });

    const slots = generateSlots({
      dateStr,
      hours: (service.vendor.hours as Hours) ?? {},
      durationMin: service.durationMin,
      taken: existing.map((b) => ({ start: b.slotStart, end: b.slotEnd })),
      now: new Date(),
    });

    return {
      serviceId,
      serviceName: service.name,
      vendorId: service.vendorId,
      vendorName: service.vendor.name,
      staffId: service.staffId,
      date: dateStr,
      durationMin: service.durationMin,
      slots,
    };
  }

  /** Bron yaratish — autentifikatsiya talab qiladi. Double-booking himoyasi bilan. */
  async create(userId: string, dto: { serviceId: string; slotStart: string; note?: string }) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { vendor: { select: { id: true, name: true, hours: true } } },
    });
    if (!service || !service.active) throw new NotFoundException('Xizmat topilmadi');

    const start = new Date(dto.slotStart);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('slotStart noto‘g‘ri');
    const end = new Date(start.getTime() + service.durationMin * 60_000);

    if (start.getTime() <= Date.now()) {
      throw new BadRequestException('O‘tgan vaqtga bron qilib bo‘lmaydi');
    }

    // Slot vendor ish vaqtiga to'g'ri kelishini va bo'shligini availability orqali tekshiramiz
    const dateStr = tashkentDateStr(start);
    const day = await this.availability(dto.serviceId, dateStr);
    const slot = day.slots.find((s) => new Date(s.start).getTime() === start.getTime());
    if (!slot) throw new BadRequestException('Bunday slot mavjud emas');
    if (!slot.available) throw new ConflictException('Bu vaqt band');

    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        // Poyga holatidan himoya: staff bo'yicha kesishuvchi faol bronni qidiramiz.
        // (staff bo'lmasa qat'iy lock yo'q — masalan restoran stoli; MVP uchun.)
        if (service.staffId) {
          const clash = await tx.booking.findFirst({
            where: {
              staffId: service.staffId,
              status: { in: [...ACTIVE_STATUSES] },
              slotStart: { lt: end },
              slotEnd: { gt: start },
            },
            select: { id: true },
          });
          if (clash) throw new ConflictException('Bu vaqt band');
        }

        return tx.booking.create({
          data: {
            userId,
            vendorId: service.vendorId,
            serviceId: service.id,
            staffId: service.staffId,
            slotStart: start,
            slotEnd: end,
            status: 'PENDING',
            note: dto.note,
          },
          include: {
            vendor: { select: { name: true, slug: true, address: true, phone: true } },
            service: { select: { name: true, price: true, durationMin: true } },
            staff: { select: { name: true } },
          },
        });
      });

      // Ilova ichida bildirishnoma (best-effort)
      void this.notifications.pushInApp(userId, 'booking_created', {
        title: 'Bron yaratildi',
        body: `${booking.service.name} — ${booking.vendor.name}`,
        href: '/bron',
      });
      this.coins.awardSafe(userId, COINS_PER_BOOKING, 'booking'); // sadoqat mukofoti
      return booking;
    } catch (e) {
      // @@unique([staffId, slotStart]) — bir vaqtli poyga backstop
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Bu vaqt band');
      }
      throw e;
    }
  }

  /** Foydalanuvchining bronlari. */
  myBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { slotStart: 'desc' },
      include: {
        vendor: { select: { name: true, slug: true, address: true, phone: true } },
        service: { select: { name: true, price: true, durationMin: true } },
        staff: { select: { name: true } },
        payment: { select: { id: true, status: true, amount: true, provider: true, paidAt: true } },
      },
    });
  }

  /** O'z bronini bekor qilish. */
  async cancel(userId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.userId !== userId) throw new NotFoundException('Bron topilmadi');
    if (booking.status === 'CANCELLED') return booking;
    if (booking.status === 'COMPLETED' || booking.status === 'NO_SHOW') {
      throw new BadRequestException('Bu bronni bekor qilib bo‘lmaydi');
    }
    return this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
