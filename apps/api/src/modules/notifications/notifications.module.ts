import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';

@Module({
  imports: [TelegramModule],
  providers: [NotificationsService, SmsService],
  exports: [NotificationsService, SmsService],
})
export class NotificationsModule {}
