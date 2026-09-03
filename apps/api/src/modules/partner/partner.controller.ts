import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnerService } from './partner.service';
import { LeadFilterDto, RegisterPartnerDto, SelectPartnerPlanDto, UpdatePartnerDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Izla Biznes — homiy self-service portali. Hamma endpoint JWT + a'zolik tekshiruvi. */
@ApiTags('partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partner')
export class PartnerController {
  constructor(private readonly partner: PartnerService) {}

  /** Yangi homiy kompaniyasini ro'yxatdan o'tkazish (onboarding). */
  @Post('register')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterPartnerDto) {
    return this.partner.register(user.sub, dto);
  }

  /** Foydalanuvchi a'zo bo'lgan kompaniyalar. */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.partner.me(user.sub);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.get(user.sub, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partner.update(user.sub, id, dto);
  }

  @Get(':id/dashboard')
  dashboard(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.dashboard(user.sub, id);
  }

  @Get(':id/products')
  products(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.products(user.sub, id);
  }

  @Get(':id/leads')
  leads(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query() filter: LeadFilterDto) {
    return this.partner.leads(user.sub, id, filter);
  }

  @Post(':id/plan')
  selectPlan(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SelectPartnerPlanDto) {
    return this.partner.selectPlan(user.sub, id, dto.plan);
  }
}
