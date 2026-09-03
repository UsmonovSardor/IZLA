import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PartnerController } from './partner.controller';
import { PartnerPlansController } from './partner-plans.controller';
import { PartnerService } from './partner.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PartnerController, PartnerPlansController],
  providers: [PartnerService, JwtAuthGuard],
})
export class PartnerModule {}
