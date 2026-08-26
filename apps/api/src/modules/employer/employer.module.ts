import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [EmployerController],
  providers: [EmployerService, JwtAuthGuard],
})
export class EmployerModule {}
