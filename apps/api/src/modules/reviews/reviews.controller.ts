import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Sharhlar — foydalanuvchi baho + fikr qoldiradi. JWT. */
@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('mine/:vendorId')
  mine(@CurrentUser() u: AuthUser, @Param('vendorId') vendorId: string) {
    return this.reviews.mine(u.sub, vendorId);
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(u.sub, dto);
  }
}
