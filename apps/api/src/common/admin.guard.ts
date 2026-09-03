import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '../config/env';
import type { AuthUser } from './jwt.guard';

/**
 * Admin-only guard: JWT'ni tekshiradi VA role === 'ADMIN' bo'lishini talab qiladi.
 * Izla Biznes daromad konsoli va boshqa ichki panellar uchun.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Avtorizatsiya talab qilinadi');
    }
    let payload: { sub: string; role: string };
    try {
      payload = await this.jwt.verifyAsync(header.slice(7), { secret: env.JWT_ACCESS_SECRET });
    } catch {
      throw new UnauthorizedException('Token yaroqsiz yoki muddati o‘tgan');
    }
    if (payload.role !== 'ADMIN') {
      throw new ForbiddenException('Bu sahifa faqat administrator uchun');
    }
    req.user = { sub: payload.sub, role: payload.role } satisfies AuthUser;
    return true;
  }
}
