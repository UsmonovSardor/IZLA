import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Premiya kotirovkasi (hisob-kitob, sotib olmasdan). */
export class QuoteDto {
  @ApiProperty({ description: 'Mahsulot ID' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Kiritilgan parametrlar (region, avto, kunlar...)' })
  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;
}

/** Polis sotib olish (server premiyani qayta hisoblaydi — klientga ishonmaydi). */
export class BuyPolicyDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Muddat (oy)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  termMonths?: number;
}
