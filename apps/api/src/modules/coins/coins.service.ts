import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Sadoqat tangalari — hodisalar uchun mukofot + tarix. */
@Injectable()
export class CoinsService {
  private readonly logger = new Logger('Coins');
  constructor(private readonly prisma: PrismaService) {}

  /** Tanga qo'shadi (transaction: balans + ledger). */
  async award(userId: string, delta: number, reason: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: delta } },
        select: { coins: true },
      });
      await tx.coinLedger.create({ data: { userId, delta, reason, balance: user.coins } });
      return user.coins;
    });
  }

  /** Best-effort — oqimni bloklamaydi. */
  awardSafe(userId: string, delta: number, reason: string): void {
    this.award(userId, delta, reason).catch((e) => this.logger.error(`Coin award xato: ${(e as Error).message}`));
  }

  /** Balans + so'nggi tarix. */
  async summary(userId: string) {
    const [user, ledger] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { coins: true } }),
      this.prisma.coinLedger.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return {
      balance: user?.coins ?? 0,
      ledger: ledger.map((l) => ({ id: l.id, delta: l.delta, reason: l.reason, balance: l.balance, createdAt: l.createdAt })),
    };
  }
}
