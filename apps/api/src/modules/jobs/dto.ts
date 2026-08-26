import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const EMPLOYMENT = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;
const EXPERIENCE = ['NONE', 'JUNIOR', 'MIDDLE', 'SENIOR'] as const;

/** Vakansiya ro'yxati uchun filtr/qidiruv parametrlari (ochiq). */
export class JobsQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsIn(EMPLOYMENT) employment?: (typeof EMPLOYMENT)[number];
  @IsOptional() @IsIn(EXPERIENCE) experience?: (typeof EXPERIENCE)[number];
  @IsOptional() @IsBooleanString() remote?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number;
}
