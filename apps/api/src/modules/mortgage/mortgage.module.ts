import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MortgageController } from './mortgage.controller';
import { MortgageService } from './mortgage.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

/** Ipoteka vertikali — bank lead-gen (embedded lending). */
@Module({
  imports: [JwtModule.register({})],
  controllers: [MortgageController],
  providers: [MortgageService, JwtAuthGuard],
  exports: [MortgageService],
})
export class MortgageModule {}
