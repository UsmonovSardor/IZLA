import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NasiyaService } from './nasiya.service';
import { NasiyaQuoteDto, NasiyaApplyDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@ApiTags('nasiya')
@Controller('nasiya')
export class NasiyaController {
  constructor(private readonly nasiya: NasiyaService) {}

  @Get('providers')
  providers() {
    return this.nasiya.providers();
  }

  @Post('quote')
  quote(@Body() dto: NasiyaQuoteDto) {
    return this.nasiya.quote(dto.amount, dto.months, dto.providerId);
  }

  @Post('apply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  apply(@CurrentUser() u: AuthUser, @Body() dto: NasiyaApplyDto) {
    return this.nasiya.apply(u.sub, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() u: AuthUser) {
    return this.nasiya.myLeads(u.sub);
  }
}
