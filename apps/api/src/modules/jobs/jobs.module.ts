import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JobsController } from './jobs.controller';
import { JobsMeController } from './jobs-me.controller';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [JobsController, JobsMeController],
  providers: [JobsService, JwtAuthGuard],
})
export class JobsModule {}
