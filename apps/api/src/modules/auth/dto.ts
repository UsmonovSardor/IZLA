import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

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
