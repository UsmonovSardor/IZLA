import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { resolveLang } from '../../common/i18n';
import { ToggleFavoriteDto } from './dto';

/** Sevimlilar — vendor saqlash (toggle) + ro'yxat. Hammasi JWT. */
@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Post('toggle')
  toggle(@CurrentUser() u: AuthUser, @Body() dto: ToggleFavoriteDto) {
    return this.favorites.toggleVendor(u.sub, dto.vendorId);
  }

  @Get('ids')
  ids(@CurrentUser() u: AuthUser) {
    return this.favorites.vendorIds(u.sub);
  }

  @Get()
  list(@CurrentUser() u: AuthUser, @Query('lang') lang?: string) {
    return this.favorites.list(u.sub, resolveLang(lang));
  }
}
