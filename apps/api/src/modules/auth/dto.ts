import { IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RequestOtpDto {
  @IsString() @Matches(/^\+998\d{9}$/, { message: 'Telefon +998XXXXXXXXX formatida' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsString() @Matches(/^\+998\d{9}$/)
  phone!: string;

  @IsString() @Length(6, 6)
  code!: string;
}

export class TelegramLoginDto {
  @IsString() @IsNotEmpty()
  initData!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(80)
  name?: string;

  @IsOptional() @IsIn(['uz', 'ru', 'en'])
  locale?: string;

  @IsOptional() @IsString() @MaxLength(500)
  avatarUrl?: string;
}
