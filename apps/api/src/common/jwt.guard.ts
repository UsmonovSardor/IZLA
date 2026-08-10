import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '../config/env';

export interface AuthUser {
  sub: string;
  role: string;
}

/**
 * Bearer access-token guard. Auth Service tomonidan berilgan JWT'ni tekshiradi
 * va `req.user = { sub, role }` ni o'rnatadi. @CurrentUser() bilan olinadi.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Avtorizatsiya talab qilinadi');
    }
    try {
      const payload = await this.jwt.verifyAsync(header.slice(7), {
        secret: env.JWT_ACCESS_SECRET,
      });
      req.user = { sub: payload.sub, role: payload.role } satisfies AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Token yaroqsiz yoki muddati o‘tgan');
    }
  }
}
