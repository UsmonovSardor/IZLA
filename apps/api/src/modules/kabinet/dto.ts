import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** Yangi biznes ro'yxatdan o'tkazish (onboarding). Vendor PENDING holatda yaratiladi. */
export class RegisterVendorDto {
  @IsString() @MaxLength(160) name!: string;
  @IsString() categoryId!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(120) district?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

/** Vendor profilini yangilash (egaga ruxsat etilgan maydonlar). */
export class UpdateVendorDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(120) district?: string;
  /** Ish vaqti: { mon_fri, sat, sun } ko'rinishida. */
  @IsOptional() @IsObject() hours?: Record<string, string>;
  /** Ijtimoiy tarmoqlar: { instagram, telegram, ... }. */
  @IsOptional() @IsObject() socials?: Record<string, string>;
}

export class CreateServiceDto {
  @IsString() @MaxLength(160) name!: string;
  @IsNumber() @Min(0) price!: number;
  @IsInt() @Min(5) durationMin!: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateServiceDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(5) durationMin?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

const OWNER_BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;

export class UpdateBookingStatusDto {
  @IsIn(OWNER_BOOKING_STATUSES)
  status!: (typeof OWNER_BOOKING_STATUSES)[number];
}
