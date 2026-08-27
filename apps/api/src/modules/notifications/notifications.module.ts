import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [TelegramModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsService, JwtAuthGuard],
  exports: [NotificationsService, SmsService],
})
export class NotificationsModule {}
