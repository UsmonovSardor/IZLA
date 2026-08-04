import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';

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
  list(
    @Query('category') category?: string,
    @Query('district') district?: string,
    @Query('q') q?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('sort') sort?: 'rating' | 'distance' | 'popular',
  ) {
    return this.vendors.list({
      category,
      district,
      q,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      sort,
    });
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.vendors.detail(slug);
  }
}
