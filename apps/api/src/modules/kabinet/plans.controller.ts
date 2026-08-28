import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PLAN_LIST } from '../../common/plans';

/** Ochiq — vendor tariflari (narxlar sahifasi + kabinet upgrade UI). */
@ApiTags('plans')
@Controller('plans')
export class PlansController {
  @Get()
  list() {
    return PLAN_LIST;
  }
}
