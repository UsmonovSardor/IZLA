import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Homiy kompaniyasini ro'yxatdan o'tkazish (onboarding). PENDING holatda yaratiladi. */
export class RegisterPartnerDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(200) legalName?: string;
  @IsOptional() @IsString() @MaxLength(40) taxId?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(200) website?: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
}

/** Homiy profilini yangilash (egaga ruxsat etilgan maydonlar). */
export class UpdatePartnerDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(200) legalName?: string;
  @IsOptional() @IsString() @MaxLength(40) taxId?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(200) website?: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
  @IsOptional() @IsString() @MaxLength(300) logoUrl?: string;
}

/** Obuna tarifini tanlash (FAZA 1: demo faollashadi; FAZA 2: real to'lov). */
export class SelectPartnerPlanDto {
  @IsIn(['FREE', 'GROWTH', 'ENTERPRISE'])
  plan!: 'FREE' | 'GROWTH' | 'ENTERPRISE';
}

/** Lead inbox filtri. */
export class LeadFilterDto {
  @IsOptional() @IsIn(['insurance', 'mortgage', 'nasiya']) channel?: 'insurance' | 'mortgage' | 'nasiya';
  @IsOptional() @IsString() status?: string;
}
