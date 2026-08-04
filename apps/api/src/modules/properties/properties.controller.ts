import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { PropertyType } from '@izla/db';
import { PropertiesService } from './properties.service';
import { CreateLeadDto } from './dto';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false, enum: PropertyType })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'rooms', required: false })
  @ApiQuery({ name: 'priceMax', required: false })
  list(
    @Query('type') type?: PropertyType,
    @Query('district') district?: string,
    @Query('rooms') rooms?: string,
    @Query('priceMax') priceMax?: string,
  ) {
    return this.properties.list({
      type,
      district,
      rooms: rooms ? Number(rooms) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.properties.detail(id);
  }

  // Demo: userId keladi (MVP'da JWT'dan olinadi). Zayavka qoldirish.
  @Post(':id/leads')
  createLead(@Param('id') id: string, @Body() dto: CreateLeadDto, @Query('userId') userId?: string) {
    return this.properties.createLead(id, {
      userId: userId ?? 'demo',
      name: dto.name,
      phone: dto.phone,
      message: dto.message,
    });
  }
}
