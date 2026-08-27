import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

class ClaimDto {
  @IsString() @MinLength(4) @MaxLength(12)
  code!: string;
}

/** Taklif tizimi — kod olish + da'vo qilish. Hammasi JWT. */
@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('me')
  me(@CurrentUser() u: AuthUser) {
    return this.referrals.me(u.sub);
  }

  @Post('claim')
  claim(@CurrentUser() u: AuthUser, @Body() dto: ClaimDto) {
    return this.referrals.claim(u.sub, dto.code);
  }
}
