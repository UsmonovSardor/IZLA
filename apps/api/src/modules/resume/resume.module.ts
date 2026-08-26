import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ResumeController],
  providers: [ResumeService, JwtAuthGuard],
})
export class ResumeModule {}
