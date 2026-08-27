import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [JwtModule.register({}), CoinsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtAuthGuard],
})
export class ReviewsModule {}
