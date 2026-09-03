import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PartnerController } from './partner.controller';
import { PartnerPlansController } from './partner-plans.controller';
import { PartnerService } from './partner.service';
import { PartnerBillingService } from './partner-billing.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [PartnerController, PartnerPlansController],
  providers: [PartnerService, PartnerBillingService, JwtAuthGuard],
})
export class PartnerModule {}
