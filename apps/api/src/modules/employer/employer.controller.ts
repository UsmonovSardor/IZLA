import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmployerService } from './employer.service';
import {
  CreateCompanyDto, CreateJobDto, UpdateApplicationStatusDto, UpdateCompanyDto, UpdateJobDto,
} from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Ish beruvchi kabineti — kompaniya, vakansiya va mini-ATS. Hammasi JWT + egalik. */
@ApiTags('employer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employer')
export class EmployerController {
  constructor(private readonly employer: EmployerService) {}

  // --- Kompaniya ---
  @Get('companies')
  myCompanies(@CurrentUser() u: AuthUser) {
    return this.employer.myCompanies(u.sub);
  }

  @Post('companies')
  createCompany(@CurrentUser() u: AuthUser, @Body() dto: CreateCompanyDto) {
    return this.employer.createCompany(u.sub, dto);
  }

  @Get('companies/:id')
  companyDetail(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.employer.companyDetail(id, u.sub);
  }

  @Patch('companies/:id')
  updateCompany(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.employer.updateCompany(id, u.sub, dto);
  }

  @Get('companies/:id/stats')
  companyStats(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.employer.companyStats(id, u.sub);
  }

  // --- Vakansiyalar ---
  @Get('companies/:id/jobs')
  companyJobs(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.employer.companyJobs(id, u.sub);
  }

  @Post('companies/:id/jobs')
  createJob(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: CreateJobDto) {
    return this.employer.createJob(id, u.sub, dto);
  }

  @Patch('jobs/:id')
  updateJob(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.employer.updateJob(id, u.sub, dto);
  }

  @Delete('jobs/:id')
  archiveJob(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.employer.archiveJob(id, u.sub);
  }

  // --- Mini-ATS ---
  @Get('jobs/:id/applications')
  jobApplications(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.employer.jobApplications(id, u.sub);
  }

  @Patch('applications/:id')
  updateApplicationStatus(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateApplicationStatusDto) {
    return this.employer.updateApplicationStatus(id, u.sub, dto);
  }
}
