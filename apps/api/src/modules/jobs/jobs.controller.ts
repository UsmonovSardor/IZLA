import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobsQueryDto } from './dto';

/** Ochiq (avtorizatsiyasiz) vakansiya endpointlari — Izla Ish. */
@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@Query() query: JobsQueryDto) {
    return this.jobs.list(query);
  }

  @Get('facets')
  facets() {
    return this.jobs.facets();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.jobs.detail(id);
  }
}
