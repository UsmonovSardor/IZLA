import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

/** Obuna tarifini tanlash: FREE darrov, pullik → hisob-faktura. */
export class SelectPartnerPlanDto {
  @IsIn(['FREE', 'GROWTH', 'ENTERPRISE'])
  plan!: 'FREE' | 'GROWTH' | 'ENTERPRISE';
}

/** DEMO: billing lifecycle'ni sinash — muddatni `daysPast` kun oldinga surish. */
export class SimulateBillingDto {
  @IsInt() @Min(-3) @Max(30) daysPast!: number;
}

// ─── Self-serve: sug'urta (insurer + mahsulot) ──────────────────────────────
const INS_TYPES = ['OSAGO', 'KASKO', 'TRAVEL', 'PROPERTY', 'ACCIDENT', 'HEALTH'] as const;

export class CreateInsurerDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
  @IsOptional() @IsString() @MaxLength(300) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

/** Sug'urta mahsuloti. tariff bo'sh bo'lsa type DEFAULTS ishlatiladi (kalkulyator darrov ishlaydi). */
export class CreateInsuranceProductDto {
  @IsString() insurerId!: string;
  @IsIn(INS_TYPES) type!: (typeof INS_TYPES)[number];
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @IsOptional() @IsNumber() @Min(0) priceFrom?: number;
  @IsOptional() @IsNumber() @Min(0) coverageFrom?: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) termsMonths?: number[];
  @IsOptional() @IsNumber() @Min(0) basePremium?: number; // ixtiyoriy: bazaviy premiya override
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
}

export class UpdateInsuranceProductDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @IsOptional() @IsNumber() @Min(0) priceFrom?: number;
  @IsOptional() @IsNumber() @Min(0) coverageFrom?: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) termsMonths?: number[];
  @IsOptional() @IsNumber() @Min(0) basePremium?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsBoolean() active?: boolean;
}

// ─── Self-serve: nasiya (provayder) ─────────────────────────────────────────
/** Nasiya provayderi. terms = {oy: ustama-koeffitsent}, masalan {"3":0,"6":0.09,"12":0.2}. */
export class CreateNasiyaProviderDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
  @IsOptional() @IsString() @MaxLength(300) logoUrl?: string;
  @IsObject() terms!: Record<string, number>;
  @IsOptional() @IsNumber() @Min(0) minAmount?: number;
  @IsOptional() @IsNumber() @Min(0) maxAmount?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
}

export class UpdateNasiyaProviderDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
  @IsOptional() @IsString() @MaxLength(300) logoUrl?: string;
  @IsOptional() @IsObject() terms?: Record<string, number>;
  @IsOptional() @IsNumber() @Min(0) minAmount?: number;
  @IsOptional() @IsNumber() @Min(0) maxAmount?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsBoolean() active?: boolean;
}

/** Lead inbox filtri. */
export class LeadFilterDto {
  @IsOptional() @IsIn(['insurance', 'mortgage', 'nasiya']) channel?: 'insurance' | 'mortgage' | 'nasiya';
  @IsOptional() @IsString() status?: string;
}

// ─── Self-serve: bank + ipoteka dasturi boshqaruvi ──────────────────────────
/** Homiy o'z bank brendini yaratadi (ipoteka kanali uchun). */
export class CreateBankDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
  @IsOptional() @IsString() @MaxLength(300) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

const PROPERTY_TYPES = ['NEW', 'CONSTRUCTION', 'SECONDARY', 'RENT'] as const;

/** Ipoteka dasturi yaratish. Kalkulyator (annuitet) annualRate'dan darrov ishlaydi. */
export class CreateMortgageProgramDto {
  @IsString() bankId!: string;
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @IsNumber() @Min(0) @Max(100) annualRate!: number;
  @IsInt() @Min(1) @Max(600) maxTermMonths!: number;
  @IsInt() @Min(0) @Max(100) minDownPct!: number;
  @IsOptional() @IsNumber() @Min(0) maxAmount?: number;
  @IsOptional() @IsArray() @IsIn(PROPERTY_TYPES, { each: true }) propertyTypes?: (typeof PROPERTY_TYPES)[number][];
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsBoolean() subsidized?: boolean;
}

/** Ipoteka dasturini yangilash (barcha maydon ixtiyoriy + active toggle). */
export class UpdateMortgageProgramDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) annualRate?: number;
  @IsOptional() @IsInt() @Min(1) @Max(600) maxTermMonths?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) minDownPct?: number;
  @IsOptional() @IsNumber() @Min(0) maxAmount?: number;
  @IsOptional() @IsArray() @IsIn(PROPERTY_TYPES, { each: true }) propertyTypes?: (typeof PROPERTY_TYPES)[number][];
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsBoolean() subsidized?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}
