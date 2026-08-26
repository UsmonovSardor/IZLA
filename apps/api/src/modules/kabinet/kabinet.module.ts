import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KabinetController } from './kabinet.controller';
import { KabinetService } from './kabinet.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [KabinetController],
  providers: [KabinetService, JwtAuthGuard],
})
export class KabinetModule {}
