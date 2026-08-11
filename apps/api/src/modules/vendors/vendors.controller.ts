import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { resolveLang } from '../../common/i18n';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'sort', required: false, enum: ['rating', 'distance', 'popular'] })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'openNow', required: false, type: Boolean })
  @ApiQuery({ name: 'lang', required: false, enum: ['uz', 'ru', 'en'] })
  list(
    @Query('category') category?: string,
    @Query('district') district?: string,
    @Query('q') q?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('sort') sort?: 'rating' | 'distance' | 'popular',
    @Query('verified') verified?: string,
    @Query('minRating') minRating?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('openNow') openNow?: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.vendors.list({
      category,
      district,
      q,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      sort,
      verified: verified === 'true' ? true : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      openNow: openNow === 'true' ? true : undefined,
      lang: resolveLang(lang, acceptLanguage),
    });
  }

  // MUHIM: 'suggest' :slug'dan OLDIN e'lon qilinadi — aks holda slug sifatida qabul qilinadi.
  @Get('suggest')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'lang', required: false, enum: ['uz', 'ru', 'en'] })
  suggest(
    @Query('q') q?: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.vendors.suggest(q ?? '', resolveLang(lang, acceptLanguage));
  }

  @Get('facets')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'openNow', required: false, type: Boolean })
  @ApiQuery({ name: 'lang', required: false, enum: ['uz', 'ru', 'en'] })
  facets(
    @Query('q') q?: string,
    @Query('district') district?: string,
    @Query('verified') verified?: string,
    @Query('minRating') minRating?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('openNow') openNow?: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.vendors.facets({
      q,
      district,
      verified: verified === 'true' ? true : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      openNow: openNow === 'true' ? true : undefined,
      lang: resolveLang(lang, acceptLanguage),
    });
  }

  @Get(':slug')
  @ApiQuery({ name: 'lang', required: false, enum: ['uz', 'ru', 'en'] })
  detail(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.vendors.detail(slug, resolveLang(lang, acceptLanguage));
  }
}
