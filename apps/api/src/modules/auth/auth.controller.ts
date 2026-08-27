import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AuthService, type AuthCtx, type AuthResult } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, TelegramLoginDto, UpdateProfileDto } from './dto';
import {
  REFRESH_COOKIE,
  parseCookies,
  setRefreshCookie,
  clearRefreshCookie,
} from '../../common/cookies';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { env } from '../../config/env';

// Express'ga qat'iy bog'lanmaslik uchun minimal shakllar
interface ReqLike {
  headers: Record<string, string | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}
interface ResLike {
  cookie(n: string, v: string, o: Record<string, unknown>): void;
  clearCookie(n: string, o?: Record<string, unknown>): void;
  redirect(url: string): void;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');
  constructor(private readonly auth: AuthService) {}

  // ---------- OTP ----------

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: ReqLike, @Res({ passthrough: true }) res: ResLike) {
    const result = await this.auth.verifyOtp(dto.phone, dto.code, this.ctx(req));
    return this.issue(res, result);
  }

  // ---------- Telegram ----------

  @Post('telegram')
  async telegram(@Body() dto: TelegramLoginDto, @Req() req: ReqLike, @Res({ passthrough: true }) res: ResLike) {
    const result = await this.auth.loginWithTelegram(dto.initData, this.ctx(req));
    return this.issue(res, result);
  }

  // ---------- Sessiya ----------

  @Post('refresh')
  async refresh(@Req() req: ReqLike, @Res({ passthrough: true }) res: ResLike) {
    const raw = this.readRefresh(req);
    try {
      const result = await this.auth.refresh(raw, this.ctx(req));
      return this.issue(res, result);
    } catch (e) {
      clearRefreshCookie(res); // yaroqsiz cookie'ni tozalaymiz
      throw e;
    }
  }

  @Post('logout')
  async logout(@Req() req: ReqLike, @Res({ passthrough: true }) res: ResLike) {
    await this.auth.logout(this.readRefresh(req));
    clearRefreshCookie(res);
    return { ok: true };
  }

  // ---------- Profil ----------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.sub, dto);
  }

  // ---------- Sessiyalar ro'yxati ----------

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  sessions(@CurrentUser() user: AuthUser, @Req() req: ReqLike) {
    return this.auth.listSessions(user.sub, this.readRefresh(req));
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revokeSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.auth.revokeSession(user.sub, id);
  }

  // ---------- Provayder holati (UI uchun) ----------

  @Get('providers')
  providers() {
    return {
      phone: true,
      telegram: Boolean(env.TELEGRAM_BOT_TOKEN),
      google: this.auth.googleEnabled,
    };
  }

  // ---------- Google OAuth ----------

  @Get('google')
  @ApiExcludeEndpoint()
  googleStart(@Res() res: ResLike) {
    if (!this.auth.googleEnabled) {
      return res.redirect(`${this.webUrl()}/kirish?error=google_off`);
    }
    // Imzolangan state (cross-site cookie'ga tayanmaymiz — Chrome bloklaydi)
    const state = this.auth.makeOAuthState();
    return res.redirect(this.auth.googleAuthUrl(state));
  }

  @Get('google/callback')
  @ApiExcludeEndpoint()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: ReqLike,
    @Res() res: ResLike,
  ) {
    if (!code || !this.auth.verifyOAuthState(state)) {
      return res.redirect(`${this.webUrl()}/kirish?error=google_state`);
    }
    try {
      const result = await this.auth.handleGoogleCallback(code, this.ctx(req));
      setRefreshCookie(res, result.refreshToken, result.refreshMaxAge);
      return res.redirect(`${this.webUrl()}/kirish?ok=1`);
    } catch (e) {
      this.logger.error(`Google callback xato: ${(e as Error).message}`);
      return res.redirect(`${this.webUrl()}/kirish?error=google_failed`);
    }
  }

  // ---------- ichki ----------

  /** Refresh cookie'ni o'rnatib, access + user qaytaradi. */
  private issue(res: ResLike, result: AuthResult) {
    setRefreshCookie(res, result.refreshToken, result.refreshMaxAge);
    return { access: result.access, user: result.user };
  }

  private readRefresh(req: ReqLike): string | undefined {
    return parseCookies(req.headers.cookie)[REFRESH_COOKIE];
  }

  private ctx(req: ReqLike): AuthCtx {
    return { userAgent: req.headers['user-agent'], ip: req.ip ?? req.socket?.remoteAddress };
  }

  private webUrl(): string {
    return (env.WEB_URL || env.CORS_ORIGIN.split(',')[0] || 'http://localhost:3000').replace(/\/$/, '');
  }
}
