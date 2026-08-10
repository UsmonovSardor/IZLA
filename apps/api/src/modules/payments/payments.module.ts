import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymeService } from './payme/payme.service';
import { ClickService } from './click/click.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymeService, ClickService, JwtAuthGuard],
})
export class PaymentsModule {}
