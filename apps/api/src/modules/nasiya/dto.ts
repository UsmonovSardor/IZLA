import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class NasiyaQuoteDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  providerId?: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber() @Min(1)
  amount!: number;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(1) @Max(36)
  months!: number;
}

export class NasiyaApplyDto {
  @ApiProperty()
  @IsString()
  providerId!: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber() @Min(1)
  amount!: number;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(1) @Max(36)
  months!: number;

  @ApiPropertyOptional() @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceId?: string;

  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiProperty() @IsString() @MinLength(7) phone!: string;
}
