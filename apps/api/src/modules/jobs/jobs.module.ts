import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JobsController } from './jobs.controller';
import { JobsMeController } from './jobs-me.controller';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [JobsController, JobsMeController],
  providers: [JobsService, JwtAuthGuard],
})
export class JobsModule {}
