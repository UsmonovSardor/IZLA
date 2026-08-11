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
  @ApiQuery({ name: 'lang', required: false, enum: ['uz', 'ru', 'en'] })
  list(
    @Query('category') category?: string,
    @Query('district') district?: string,
    @Query('q') q?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('sort') sort?: 'rating' | 'distance' | 'popular',
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
