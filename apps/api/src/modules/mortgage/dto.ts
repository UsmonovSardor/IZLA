import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CalcDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiProperty({ description: 'Obyekt narxi (so\'m)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  price!: number;

  @ApiPropertyOptional({ description: 'Boshlang\'ich to\'lov (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  downPct?: number;

  @ApiPropertyOptional({ description: 'Boshlang\'ich to\'lov (so\'m)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downAmount?: number;

  @ApiProperty({ description: 'Muddat (oy)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(360)
  termMonths!: number;

  @ApiPropertyOptional({ description: 'Yillik stavka (dastursiz kalkulyator uchun)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  annualRate?: number;
}

export class ApplyMortgageDto extends CalcDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complexId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(7)
  phone!: string;
}
