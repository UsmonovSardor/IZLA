import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyType } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface PropertyQuery {
  type?: PropertyType;
  district?: string;
  rooms?: number;
  priceMax?: number;
  take?: number;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(query: PropertyQuery) {
    const where: Prisma.PropertyWhereInput = { status: 'AVAILABLE' };
    if (query.type) where.type = query.type;
    if (query.district) where.district = query.district;
    if (query.rooms) where.rooms = query.rooms;
    if (query.priceMax) where.price = { lte: new Prisma.Decimal(query.priceMax) };

    return this.prisma.property.findMany({
      where,
      take: query.take ?? 50,
      orderBy: { createdAt: 'desc' },
      include: { complex: { select: { name: true, slug: true, readinessPercent: true, status: true } } },
    });
  }

  async detail(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        complex: {
          include: {
            developer: { select: { name: true, slug: true, verified: true, rating: true } },
            constructionUpdates: { orderBy: { date: 'desc' }, take: 10 },
          },
        },
      },
    });
    if (!property) throw new NotFoundException('Obyekt topilmadi');
    return property;
  }

  // Zayavka (lead) yaratish — sotuvchi/developerga murojaat
  async createLead(propertyId: string, data: { userId: string; name: string; phone: string; message?: string }) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Obyekt topilmadi');

    const lead = await this.prisma.propertyLead.create({
      data: {
        propertyId,
        complexId: property.complexId,
        userId: data.userId,
        name: data.name,
        phone: data.phone,
        message: data.message,
        status: 'NEW',
      },
    });

    // Developer/rieltorga SMS + xaridorga ilova-ichi tasdiq (best-effort, bloklamaydi)
    void this.notifications.propertyLeadCreated(lead.id);

    return { ok: true, leadId: lead.id, status: lead.status };
  }
}
