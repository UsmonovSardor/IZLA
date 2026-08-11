import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveLang, localizedName } from '../../common/i18n';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiQuery({ name: 'lang', required: false, enum: ['uz', 'ru', 'en'] })
  async list(
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const L = resolveLang(lang, acceptLanguage);
    const rows = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { vendors: true } } },
    });
    return rows.map((c) => ({ ...c, name: localizedName(c, L) }));
  }
}
