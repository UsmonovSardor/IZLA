import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Sadoqat tangalari — balans + tarix. JWT. */
@ApiTags('coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coins')
export class CoinsController {
  constructor(private readonly coins: CoinsService) {}

  @Get()
  summary(@CurrentUser() u: AuthUser) {
    return this.coins.summary(u.sub);
  }
}
