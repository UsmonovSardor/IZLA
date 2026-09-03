import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PARTNER_PLAN_LIST } from '../../common/partner-plans';

/** Ochiq — homiy obuna tariflari (Izla Biznes narxlar sahifasi + onboarding UI). */
@ApiTags('partner-plans')
@Controller('partner-plans')
export class PartnerPlansController {
  @Get()
  list() {
    return PARTNER_PLAN_LIST;
  }
}
