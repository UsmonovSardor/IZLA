import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule, CoinsModule],
  controllers: [BookingsController],
  providers: [BookingsService, JwtAuthGuard],
})
export class BookingsModule {}
