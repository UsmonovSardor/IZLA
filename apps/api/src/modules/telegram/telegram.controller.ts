import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly tg: TelegramService) {}

  // Telegram bu endpoint'ga update yuboradi
  @Post('webhook')
  @SkipThrottle()
  webhook(@Body() update: Record<string, unknown>) {
    return this.tg.handleUpdate(update as never);
  }

  // Deploy'dan keyin bir marta: POST /telegram/setup?url=https://<api-domain>
  @Post('setup')
  setup(@Query('url') url: string) {
    return this.tg.setup(url);
  }
}
