import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [FavoritesController],
  providers: [FavoritesService, JwtAuthGuard],
})
export class FavoritesModule {}
