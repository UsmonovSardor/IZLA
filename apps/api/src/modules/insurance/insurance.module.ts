import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

/** Sug'urta vertikali — embedded insurance (Kafil va boshqalar). */
@Module({
  imports: [JwtModule.register({})],
  controllers: [InsuranceController],
  providers: [InsuranceService, JwtAuthGuard],
  exports: [InsuranceService],
})
export class InsuranceModule {}
