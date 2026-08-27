import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto';
import type { User } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { env } from '../../config/env';

// MVP dev rejimida OTP fikslangan.
const DEV_OTP = '111111';

// OTP siyosati
const OTP_TTL_MS = 5 * 60 * 1000; // kod amal muddati
const OTP_RESEND_MS = 60 * 1000; // qayta yuborish oralig'i
const OTP_MAX_ATTEMPTS = 5; // bitta kodga urinishlar
const OTP_MAX_SENDS_PER_HOUR = 5; // bitta raqamga soatiga

// Sessiya (refresh) muddati
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthCtx {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult {
  access: string;
  refreshToken: string;
  refreshMaxAge: number;
  user: ReturnType<AuthService['publicUser']>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sms: SmsService,
  ) {}

  private get isDev() {
    return env.NODE_ENV === 'development';
  }

  // ==================== OTP ====================

  async requestOtp(phone: string) {
    const now = Date.now();

    // Soatlik limit
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const recent = await this.prisma.otpChallenge.count({
      where: { phone, createdAt: { gte: hourAgo } },
    });
    if (recent >= OTP_MAX_SENDS_PER_HOUR) {
      throw new HttpException('Juda ko‘p urinish. Bir ozdan so‘ng qayta urinib ko‘ring.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Qayta yuborish oralig'i
    const last = await this.prisma.otpChallenge.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });
    if (last && now - last.createdAt.getTime() < OTP_RESEND_MS) {
      const wait = Math.ceil((OTP_RESEND_MS - (now - last.createdAt.getTime())) / 1000);
      throw new HttpException(`Yangi kod uchun ${wait} soniya kuting.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.isDev ? DEV_OTP : String(randomInt(100000, 1000000));
    await this.prisma.otpChallenge.create({
      data: { phone, codeHash: this.hashCode(phone, code), expiresAt: new Date(now + OTP_TTL_MS) },
    });

    if (!this.isDev) {
      await this.sms.send(phone, `Izla.uz tasdiqlash kodi: ${code}. Uni hech kimga bermang.`);
    }

    return {
      ok: true,
      resendAfter: OTP_RESEND_MS / 1000,
      expiresIn: OTP_TTL_MS / 1000,
      devHint: this.isDev ? DEV_OTP : undefined,
    };
  }

  async verifyOtp(phone: string, code: string, ctx: AuthCtx): Promise<AuthResult> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) throw new UnauthorizedException('Kod so‘ralmagan yoki allaqachon ishlatilgan');
    if (challenge.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Kod muddati o‘tgan');
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Urinishlar tugadi. Yangi kod so‘rang.');
    }

    if (challenge.codeHash !== this.hashCode(phone, code)) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Kod noto‘g‘ri');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, role: 'USER' },
    });
    return this.startSession(user, ctx);
  }

  // ==================== Telegram ====================

  async loginWithTelegram(initData: string, ctx: AuthCtx): Promise<AuthResult> {
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get('hash');
    if (!hash) throw new UnauthorizedException('initData noto‘g‘ri');
    if (!env.TELEGRAM_BOT_TOKEN) throw new UnauthorizedException('Bot token sozlanmagan');

    parsed.delete('hash');
    const dataCheckString = [...parsed.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secret = createHmac('sha256', 'WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
    const computed = createHmac('sha256', secret).update(dataCheckString).digest('hex');
    if (computed !== hash) throw new UnauthorizedException('initData imzosi noto‘g‘ri');

    const userRaw = parsed.get('user');
    const tgUser = userRaw
      ? (JSON.parse(userRaw) as { id: number; first_name?: string; username?: string; photo_url?: string })
      : null;
    if (!tgUser) throw new UnauthorizedException('Telegram user yo‘q');

    const phone = `tg:${tgUser.id}`;
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: { name: tgUser.first_name ?? undefined, avatarUrl: tgUser.photo_url ?? undefined },
      create: {
        phone,
        name: tgUser.first_name ?? tgUser.username ?? 'Telegram user',
        avatarUrl: tgUser.photo_url ?? undefined,
        role: 'USER',
      },
    });
    return this.startSession(user, ctx);
  }

  // ==================== Google OAuth ====================

  get googleEnabled(): boolean {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  private googleRedirectUri(): string {
    return env.GOOGLE_REDIRECT_URI || `${env.PUBLIC_API_URL.replace(/\/$/, '')}/auth/google/callback`;
  }

  /**
   * OAuth `state` — imzolangan (stateless). Cross-site cookie'ga tayanmaydi
   * (Chrome uchinchi-tomon cookie'ni bloklaydi → state cookie yo'qoladi).
   * Format: `nonce.exp.hmac`. CSRF himoyasi: imzo taxmin qilib bo'lmaydi.
   */
  makeOAuthState(): string {
    const nonce = randomBytes(12).toString('hex');
    const exp = Date.now() + 10 * 60 * 1000;
    const payload = `${nonce}.${exp}`;
    const sig = createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('hex').slice(0, 32);
    return `${payload}.${sig}`;
  }

  verifyOAuthState(state?: string): boolean {
    if (!state) return false;
    const parts = state.split('.');
    if (parts.length !== 3) return false;
    const [nonce, exp, sig] = parts;
    const payload = `${nonce}.${exp}`;
    const expected = createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('hex').slice(0, 32);
    if (sig !== expected) return false;
    if (!Number(exp) || Number(exp) < Date.now()) return false;
    return true;
  }

  googleAuthUrl(state: string): string {
    const qs = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: this.googleRedirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${qs.toString()}`;
  }

  async handleGoogleCallback(code: string, ctx: AuthCtx): Promise<AuthResult> {
    if (!this.googleEnabled) throw new BadRequestException('Google kirish sozlanmagan');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: this.googleRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      this.logger.error(`Google token HTTP ${tokenRes.status} redirect_uri=${this.googleRedirectUri()} → ${body}`);
      throw new UnauthorizedException('Google token almashuvi muvaffaqiyatsiz');
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) throw new UnauthorizedException('Google tokeni yo‘q');

    const profRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profRes.ok) throw new UnauthorizedException('Google profilini olishda xato');
    const p = (await profRes.json()) as { sub: string; email?: string; name?: string; picture?: string };

    const user = await this.prisma.user.upsert({
      where: { googleId: p.sub },
      update: { name: p.name ?? undefined, avatarUrl: p.picture ?? undefined },
      create: {
        phone: `google:${p.sub}`,
        googleId: p.sub,
        email: p.email ?? undefined,
        name: p.name ?? undefined,
        avatarUrl: p.picture ?? undefined,
        role: 'USER',
      },
    });
    return this.startSession(user, ctx);
  }

  // ==================== Sessiya (refresh) ====================

  async refresh(rawToken: string | undefined, ctx: AuthCtx): Promise<AuthResult> {
    if (!rawToken) throw new UnauthorizedException('Sessiya topilmadi');
    const session = await this.prisma.session.findUnique({
      where: { refreshHash: this.hashToken(rawToken) },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Sessiya yaroqsiz yoki muddati o‘tgan');
    }

    // Rotatsiya: yangi refresh, eski hash bekor (o'rniga yoziladi), sliding muddat
    const newRaw = this.newRawToken();
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshHash: this.hashToken(newRaw),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        userAgent: ctx.userAgent ?? session.userAgent,
        ip: ctx.ip ?? session.ip,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
    return {
      access: await this.signAccess(user),
      refreshToken: newRaw,
      refreshMaxAge: SESSION_TTL_MS,
      user: this.publicUser(user),
    };
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return { ok: true };
    await this.prisma.session.updateMany({
      where: { refreshHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async listSessions(userId: string, currentRawToken?: string) {
    const currentHash = currentRawToken ? this.hashToken(currentRawToken) : null;
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      current: currentHash != null && s.refreshHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const res = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException('Sessiya topilmadi');
    return { ok: true };
  }

  // ==================== Profil ====================

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return this.publicUser(user);
  }

  async updateProfile(userId: string, dto: { name?: string; locale?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? undefined,
        locale: dto.locale ?? undefined,
        avatarUrl: dto.avatarUrl ?? undefined,
      },
    });
    return this.publicUser(user);
  }

  // ==================== ichki ====================

  private async startSession(user: User, ctx: AuthCtx): Promise<AuthResult> {
    const raw = this.newRawToken();
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: this.hashToken(raw),
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
    return {
      access: await this.signAccess(user),
      refreshToken: raw,
      refreshMaxAge: SESSION_TTL_MS,
      user: this.publicUser(user),
    };
  }

  private signAccess(user: Pick<User, 'id' | 'role'>) {
    return this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: env.JWT_ACCESS_SECRET, expiresIn: env.JWT_ACCESS_TTL },
    );
  }

  private newRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(`${raw}:${env.JWT_REFRESH_SECRET}`).digest('hex');
  }

  private hashCode(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}:${env.JWT_ACCESS_SECRET}`).digest('hex');
  }

  private authProvider(phone: string): 'phone' | 'telegram' | 'google' {
    if (phone.startsWith('tg:')) return 'telegram';
    if (phone.startsWith('google:')) return 'google';
    return 'phone';
  }

  publicUser(u: User) {
    const provider = this.authProvider(u.phone);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: provider === 'phone' ? u.phone : null,
      provider,
      role: u.role,
      locale: u.locale,
      avatarUrl: u.avatarUrl,
      coins: u.coins,
    };
  }
}
