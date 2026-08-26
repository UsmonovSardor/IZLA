import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Vakansiyaga ariza topshirish — ixtiyoriy qisqa xat. */
export class ApplyDto {
  @IsOptional() @IsString() @MaxLength(1500) coverNote?: string;
}
