import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Xizmat ID' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ description: 'Slot boshlanishi (ISO UTC, availability’dan olingan)', example: '2026-08-11T04:00:00.000Z' })
  @IsISO8601()
  slotStart!: string;

  @ApiProperty({ required: false, description: 'Izoh (ixtiyoriy)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
