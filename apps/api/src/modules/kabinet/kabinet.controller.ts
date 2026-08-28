import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KabinetService } from './kabinet.service';
import { CreateServiceDto, RegisterVendorDto, SelectPlanDto, UpdateBookingStatusDto, UpdateServiceDto, UpdateVendorDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Vendor egasining self-service kabineti. Hamma endpoint JWT + egalik tekshiruvi. */
@ApiTags('kabinet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kabinet')
export class KabinetController {
  constructor(private readonly kabinet: KabinetService) {}

  /** Yangi biznes ro'yxatdan o'tkazish (onboarding) — vendor PENDING yaratiladi. */
  @Post('register')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterVendorDto) {
    return this.kabinet.register(user.sub, dto);
  }

  @Get('vendors')
  myVendors(@CurrentUser() user: AuthUser) {
    return this.kabinet.myVendors(user.sub);
  }

  @Get('vendors/:id')
  vendorDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kabinet.vendorDetail(id, user.sub);
  }

  @Patch('vendors/:id')
  updateVendor(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.kabinet.updateVendor(id, user.sub, dto);
  }

  @Get('vendors/:id/bookings')
  bookings(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kabinet.vendorBookings(id, user.sub);
  }

  @Get('vendors/:id/stats')
  stats(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kabinet.vendorStats(id, user.sub);
  }

  @Post('vendors/:id/services')
  createService(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateServiceDto) {
    return this.kabinet.createService(id, user.sub, dto);
  }

  @Patch('services/:id')
  updateService(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.kabinet.updateService(id, user.sub, dto);
  }

  @Delete('services/:id')
  deleteService(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kabinet.deleteService(id, user.sub);
  }

  @Patch('bookings/:id')
  updateBooking(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.kabinet.updateBookingStatus(id, user.sub, dto);
  }

  @Get('vendors/:id/earnings')
  earnings(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.kabinet.earnings(id, user.sub);
  }

  @Post('vendors/:id/plan')
  selectPlan(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SelectPlanDto) {
    return this.kabinet.selectPlan(id, user.sub, dto.plan);
  }
}
