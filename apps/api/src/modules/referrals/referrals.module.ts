import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { CoinsModule } from '../coins/coins.module';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({}), CoinsModule],
  controllers: [ReferralsController],
  providers: [ReferralsService, JwtAuthGuard],
})
export class ReferralsModule {}
