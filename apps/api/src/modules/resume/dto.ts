import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

/** Ish tajribasi yozuvi. */
export class ExperienceItemDto {
  @IsString() @MaxLength(120) title!: string;
  @IsString() @MaxLength(120) company!: string;
  @IsOptional() @IsString() @MaxLength(20) from?: string;
  @IsOptional() @IsString() @MaxLength(20) to?: string;
  @IsOptional() @IsString() @MaxLength(600) desc?: string;
}

/** Ta'lim yozuvi. */
export class EducationItemDto {
  @IsString() @MaxLength(160) degree!: string;
  @IsString() @MaxLength(160) school!: string;
  @IsOptional() @IsString() @MaxLength(20) year?: string;
}

/** Rezyume yaratish/yangilash (upsert — foydalanuvchiga bitta). */
export class UpsertResumeDto {
  @IsString() @MaxLength(140) headline!: string;
  @IsOptional() @IsString() @MaxLength(2000) summary?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(40) skills?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(60) experienceYears?: number;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(120) email?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ExperienceItemDto)
  experience?: ExperienceItemDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => EducationItemDto)
  education?: EducationItemDto[];
}
