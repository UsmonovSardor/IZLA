import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NasiyaController } from './nasiya.controller';
import { NasiyaService } from './nasiya.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

/** Nasiya / BNPL vertikali — bo'lib to'lash lead-gen. */
@Module({
  imports: [JwtModule.register({})],
  controllers: [NasiyaController],
  providers: [NasiyaService, JwtAuthGuard],
  exports: [NasiyaService],
})
export class NasiyaModule {}
