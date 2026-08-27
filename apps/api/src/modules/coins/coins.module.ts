import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CoinsController],
  providers: [CoinsService, JwtAuthGuard],
  exports: [CoinsService],
})
export class CoinsModule {}
