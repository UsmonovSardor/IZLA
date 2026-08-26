import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';

const EMPLOYMENT = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;
const EXPERIENCE = ['NONE', 'JUNIOR', 'MIDDLE', 'SENIOR'] as const;
const JOB_STATUS = ['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as const;
const APP_STATUS = ['NEW', 'VIEWED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] as const;

/** Kompaniya yaratish (ish beruvchi). */
export class CreateCompanyDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) industry?: string;
  @IsOptional() @IsString() @MaxLength(20) size?: string;
  @IsOptional() @IsString() @MaxLength(2000) about?: string;
  @IsOptional() @IsString() @MaxLength(80) district?: string;
  @IsOptional() @IsString() @MaxLength(200) website?: string;
  @IsOptional() @IsString() @MaxLength(500) logo?: string;
  @IsOptional() @IsString() @MaxLength(500) cover?: string;
}

/** Kompaniya profilini yangilash. */
export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(120) industry?: string;
  @IsOptional() @IsString() @MaxLength(20) size?: string;
  @IsOptional() @IsString() @MaxLength(2000) about?: string;
  @IsOptional() @IsString() @MaxLength(80) district?: string;
  @IsOptional() @IsString() @MaxLength(200) website?: string;
  @IsOptional() @IsString() @MaxLength(500) logo?: string;
  @IsOptional() @IsString() @MaxLength(500) cover?: string;
}

/** Vakansiya yaratish. */
export class CreateJobDto {
  @IsString() @MaxLength(160) title!: string;
  @IsString() @MaxLength(6000) description!: string;
  @IsOptional() @IsIn(EMPLOYMENT) employment?: (typeof EMPLOYMENT)[number];
  @IsOptional() @IsBoolean() remote?: boolean;
  @IsOptional() @IsString() @MaxLength(80) region?: string;
  @IsOptional() @IsIn(EXPERIENCE) experience?: (typeof EXPERIENCE)[number];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMax?: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(30) skills?: string[];
  @IsOptional() @IsString() @MaxLength(60) category?: string;
  @IsOptional() @IsIn(JOB_STATUS) status?: (typeof JOB_STATUS)[number];
}

/** Vakansiyani yangilash (barcha maydon ixtiyoriy). */
export class UpdateJobDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(6000) description?: string;
  @IsOptional() @IsIn(EMPLOYMENT) employment?: (typeof EMPLOYMENT)[number];
  @IsOptional() @IsBoolean() remote?: boolean;
  @IsOptional() @IsString() @MaxLength(80) region?: string;
  @IsOptional() @IsIn(EXPERIENCE) experience?: (typeof EXPERIENCE)[number];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMax?: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(30) skills?: string[];
  @IsOptional() @IsString() @MaxLength(60) category?: string;
  @IsOptional() @IsIn(JOB_STATUS) status?: (typeof JOB_STATUS)[number];
}

/** Ariza holatini o'zgartirish (mini-ATS). */
export class UpdateApplicationStatusDto {
  @IsIn(APP_STATUS) status!: (typeof APP_STATUS)[number];
}
