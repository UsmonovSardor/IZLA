import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Bildirishnomalar markazi — ro'yxat, o'qilmagan soni, o'qildi belgilash. JWT. */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.notifications.list(u.sub);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() u: AuthUser) {
    return this.notifications.unreadCount(u.sub);
  }

  @Post('read-all')
  readAll(@CurrentUser() u: AuthUser) {
    return this.notifications.markAllRead(u.sub);
  }

  @Post(':id/read')
  read(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(id, u.sub);
  }
}
