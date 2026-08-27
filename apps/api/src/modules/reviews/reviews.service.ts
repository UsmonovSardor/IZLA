import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Foydalanuvchining shu vendor uchun sharhi (bor bo'lsa). */
  async mine(userId: string, vendorId: string) {
    const review = await this.prisma.review.findFirst({
      where: { userId, vendorId },
      select: { id: true, rating: true, text: true, createdAt: true },
    });
    return { review };
  }

  /**
   * Sharh yaratish. Har foydalanuvchi bitta vendorga bitta sharh.
   * Vendor reytingi vaznli o'rtacha bilan yangilanadi (seed reyting/soni saqlanadi).
   */
  async create(userId: string, dto: CreateReviewDto) {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Reyting 1..5 oralig‘ida bo‘lishi kerak');

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, rating: true, reviewCount: true },
    });
    if (!vendor) throw new NotFoundException('Vendor topilmadi');

    const existing = await this.prisma.review.findFirst({ where: { userId, vendorId: dto.vendorId } });
    if (existing) throw new ConflictException('Siz bu joyga allaqachon sharh qoldirgansiz');

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId,
          vendorId: dto.vendorId,
          rating: dto.rating,
          text: dto.text?.trim() || null,
          status: 'PUBLISHED',
        },
        include: { user: { select: { name: true, avatarUrl: true } } },
      });
      // Vaznli o'rtacha: (eski_reyting*eski_soni + yangi) / (eski_soni+1)
      const oldCount = vendor.reviewCount;
      const newCount = oldCount + 1;
      const newRating = Math.round(((vendor.rating * oldCount + dto.rating) / newCount) * 10) / 10;
      await tx.vendor.update({
        where: { id: vendor.id },
        data: { reviewCount: newCount, rating: newRating },
      });
      return created;
    });

    return {
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      user: { name: review.user.name, avatarUrl: review.user.avatarUrl },
    };
  }
}
