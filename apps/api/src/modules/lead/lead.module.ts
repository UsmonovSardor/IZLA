import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeadDeliveryService } from './lead-delivery.service';

/**
 * Izla Biznes — CPL lead-yetkazish dvigateli (barcha kanal uchun umumiy).
 * Sug'urta / ipoteka / nasiya modullari import qilib, ariza yaratilgach chaqiradi.
 */
@Module({
  imports: [NotificationsModule],
  providers: [LeadDeliveryService],
  exports: [LeadDeliveryService],
})
export class LeadModule {}
