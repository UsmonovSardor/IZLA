import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResumeService } from './resume.service';
import { UpsertResumeDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Nomzod rezyumesi — CRUD (JWT). Foydalanuvchiga bitta rezyume. */
@ApiTags('resume')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resume')
export class ResumeController {
  constructor(private readonly resume: ResumeService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.resume.me(user.sub);
  }

  @Put()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertResumeDto) {
    return this.resume.upsert(user.sub, dto);
  }
}
