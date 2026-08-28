import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InsuranceService, type ProductFilter } from './insurance.service';
import { QuoteDto, BuyPolicyDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

const numOr = (v?: string): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return isFinite(n) ? n : undefined;
};

@ApiTags('insurance')
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insurance: InsuranceService) {}

  private parseFilter(q: Record<string, string | undefined>): ProductFilter {
    return {
      type: q.type,
      insurer: q.insurer,
      maxPrice: numOr(q.maxPrice),
      minCoverage: numOr(q.minCoverage),
      term: numOr(q.term),
      popular: q.popular === 'true',
      q: q.q,
      sort: q.sort as ProductFilter['sort'],
    };
  }

  @Get('products')
  products(@Query() q: Record<string, string | undefined>) {
    return this.insurance.products(this.parseFilter(q));
  }

  @Get('facets')
  facets(@Query() q: Record<string, string | undefined>) {
    return this.insurance.facets(this.parseFilter(q));
  }

  @Get('product/:slug')
  product(@Param('slug') slug: string) {
    return this.insurance.product(slug);
  }

  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.insurance.quote(dto.productId, dto.params ?? {});
  }

  // --- Himoyalangan (JWT) ---
  @Post('buy')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  buy(@CurrentUser() u: AuthUser, @Body() dto: BuyPolicyDto) {
    return this.insurance.buy(u.sub, { productId: dto.productId, params: dto.params, termMonths: dto.termMonths });
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() u: AuthUser) {
    return this.insurance.myPolicies(u.sub);
  }
}
