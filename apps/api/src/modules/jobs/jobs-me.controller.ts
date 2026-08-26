import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { ApplyDto } from './apply.dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Avtorizatsiyali vakansiya endpointlari — ariza topshirish va nomzod arizalari. */
@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsMeController {
  constructor(private readonly jobs: JobsService) {}

  @Get('me/applications')
  myApplications(@CurrentUser() user: AuthUser) {
    return this.jobs.myApplications(user.sub);
  }

  @Get(':id/application')
  applicationStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobs.applicationStatus(id, user.sub);
  }

  @Post(':id/apply')
  apply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApplyDto) {
    return this.jobs.apply(id, user.sub, dto);
  }
}
