import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CoinsService } from '../coins/coins.service';

const REFERRER_REWARD = 150; // taklif qilgan
const JOIN_REWARD = 50; // taklif bilan qo'shilgan
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // chalkash belgilarsiz (0/O/1/I yo'q)

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coins: CoinsService,
  ) {}

  private randomCode(len = 6): string {
    let s = '';
    for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return s;
  }

  /** Foydalanuvchining taklif kodini qaytaradi (yo'q bo'lsa yaratadi). */
  private async ensureCode(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (u?.referralCode) return u.referralCode;
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = this.randomCode();
      try {
        const updated = await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code }, select: { referralCode: true } });
        return updated.referralCode!;
      } catch (e) {
        // Kod to'qnashuvi — qayta urinamiz
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
    }
    throw new BadRequestException('Taklif kodini yaratib bo‘lmadi');
  }

  /** Taklif paneli — kod, taklif qilinganlar soni, ishlab topilgan tanga. */
  async me(userId: string) {
    const code = await this.ensureCode(userId);
    const [invitedCount, earned] = await Promise.all([
      this.prisma.user.count({ where: { referredById: userId } }),
      this.prisma.coinLedger.aggregate({ where: { userId, reason: 'referral' }, _sum: { delta: true } }),
    ]);
    return {
      code,
      invitedCount,
      coinsEarned: earned._sum.delta ?? 0,
      referrerReward: REFERRER_REWARD,
      joinReward: JOIN_REWARD,
    };
  }

  /** Yangi foydalanuvchi taklif kodini "da'vo qiladi" — bir marta, o'ziniki bo'lmasligi kerak. */
  async claim(userId: string, rawCode: string) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) throw new BadRequestException('Kod bo‘sh');

    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, referredById: true, referralCode: true } });
    if (!me) throw new BadRequestException('Foydalanuvchi topilmadi');
    if (me.referredById) return { ok: false, reason: 'already' as const };
    if (me.referralCode === code) return { ok: false, reason: 'self' as const };

    const referrer = await this.prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!referrer) return { ok: false, reason: 'invalid' as const };
    if (referrer.id === userId) return { ok: false, reason: 'self' as const };

    // Attributsiya — faqat referredById hali null bo'lsa (poyga-xavfsiz: updateMany filtri)
    const res = await this.prisma.user.updateMany({
      where: { id: userId, referredById: null },
      data: { referredById: referrer.id },
    });
    if (res.count === 0) return { ok: false, reason: 'already' as const };

    // Mukofotlar (best-effort)
    this.coins.awardSafe(referrer.id, REFERRER_REWARD, 'referral');
    this.coins.awardSafe(userId, JOIN_REWARD, 'referral_join');
    return { ok: true as const, joinReward: JOIN_REWARD };
  }
}
