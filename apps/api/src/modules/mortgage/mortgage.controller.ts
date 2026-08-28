import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MortgageService, type ProgramFilter } from './mortgage.service';
import { CalcDto, ApplyMortgageDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

const numOr = (v?: string): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return isFinite(n) ? n : undefined;
};

@ApiTags('mortgage')
@Controller('mortgage')
export class MortgageController {
  constructor(private readonly mortgage: MortgageService) {}

  private parseFilter(q: Record<string, string | undefined>): ProgramFilter {
    return {
      bank: q.bank,
      maxRate: numOr(q.maxRate),
      minTerm: numOr(q.minTerm),
      maxDown: numOr(q.maxDown),
      propertyType: q.propertyType,
      subsidized: q.subsidized === 'true',
      q: q.q,
      sort: q.sort as ProgramFilter['sort'],
    };
  }

  @Get('programs')
  programs(@Query() q: Record<string, string | undefined>) {
    return this.mortgage.programs(this.parseFilter(q));
  }

  @Get('facets')
  facets(@Query() q: Record<string, string | undefined>) {
    return this.mortgage.facets(this.parseFilter(q));
  }

  @Get('program/:slug')
  program(@Param('slug') slug: string) {
    return this.mortgage.program(slug);
  }

  @Post('calc')
  calc(@Body() dto: CalcDto) {
    return this.mortgage.calc(dto);
  }

  @Post('apply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  apply(@CurrentUser() u: AuthUser, @Body() dto: ApplyMortgageDto) {
    return this.mortgage.apply(u.sub, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() u: AuthUser) {
    return this.mortgage.myLeads(u.sub);
  }
}
