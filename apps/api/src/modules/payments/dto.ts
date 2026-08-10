import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Bron (booking) ID' })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({ enum: ['PAYME', 'CLICK'], description: 'To‘lov provayderi' })
  @IsIn(['PAYME', 'CLICK'])
  provider!: 'PAYME' | 'CLICK';
}
