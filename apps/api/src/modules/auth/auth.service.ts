import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { env } from '../../config/env';

// MVP: dev rejimida OTP fikslangan. Prod'da Eskiz SMS + Redis TTL bilan almashtiriladi.
const DEV_OTP = '111111';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async requestOtp(phone: string) {
    // TODO(prod): Eskiz orqali SMS yuborish + Redis'da kod saqlash (TTL 5 daqiqa)
    return { ok: true, devHint: env.NODE_ENV === 'development' ? DEV_OTP : undefined };
  }

  async verifyOtp(phone: string, code: string) {
    if (env.NODE_ENV === 'development' ? code !== DEV_OTP : true) {
      // prod'da bu yer real tekshiruv bilan almashadi
      if (env.NODE_ENV === 'development' && code !== DEV_OTP) {
        throw new UnauthorizedException('Kod noto‘g‘ri');
      }
    }
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, role: 'USER' },
    });
    return this.issueTokens(user.id, user.role);
  }

  // Telegram Mini App: initData HMAC validatsiyasi (rasmiy algoritm)
  async loginWithTelegram(initData: string) {
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get('hash');
    if (!hash) throw new UnauthorizedException('initData noto‘g‘ri');
    if (!env.TELEGRAM_BOT_TOKEN) throw new UnauthorizedException('Bot token sozlanmagan');

    parsed.delete('hash');
    const dataCheckString = [...parsed.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
    const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (computed !== hash) throw new UnauthorizedException('initData imzosi noto‘g‘ri');

    const userRaw = parsed.get('user');
    const tgUser = userRaw ? (JSON.parse(userRaw) as { id: number; first_name?: string; username?: string }) : null;
    if (!tgUser) throw new UnauthorizedException('Telegram user yo‘q');

    const phone = `tg:${tgUser.id}`;
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: { name: tgUser.first_name ?? undefined },
      create: { phone, name: tgUser.first_name ?? tgUser.username ?? 'Telegram user', role: 'USER' },
    });
    return this.issueTokens(user.id, user.role);
  }

  private async issueTokens(sub: string, role: string) {
    const access = await this.jwt.signAsync(
      { sub, role },
      { secret: env.JWT_ACCESS_SECRET, expiresIn: env.JWT_ACCESS_TTL },
    );
    const refresh = await this.jwt.signAsync(
      { sub, role, typ: 'refresh' },
      { secret: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_TTL },
    );
    return { access, refresh, userId: sub, role };
  }
}
