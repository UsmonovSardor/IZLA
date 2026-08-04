import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsString() @IsNotEmpty() @MaxLength(20)
  phone!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  message?: string;
}
