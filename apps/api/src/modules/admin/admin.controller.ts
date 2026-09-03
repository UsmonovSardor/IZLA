import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/admin.guard';

/** Izla Biznes — admin daromad konsoli. Faqat role=ADMIN. */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Barcha kanal komissiyasi + MRR/ARR + homiy statistikasi. */
  @Get('revenue')
  revenue() {
    return this.admin.revenue();
  }

  /** Barcha homiylar ro'yxati. */
  @Get('partners')
  partners() {
    return this.admin.partners();
  }
}
