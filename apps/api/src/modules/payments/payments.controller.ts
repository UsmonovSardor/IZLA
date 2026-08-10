import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymeService } from './payme/payme.service';
import { ClickService } from './click/click.service';
import { CreateInvoiceDto } from './dto';
import { invalidAuth } from './payme/payme.errors';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly payme: PaymeService,
    private readonly click: ClickService,
  ) {}

  // ---------- Foydalanuvchi (JWT) ----------

  /** Bron uchun invoice yaratadi va checkout URL qaytaradi. */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.payments.createInvoice(user.sub, dto);
  }

  /** Bronga bog'langan to'lov holati (poll uchun). Aynan `:id`dan oldin turishi kerak. */
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  byBooking(@CurrentUser() user: AuthUser, @Param('bookingId') bookingId: string) {
    return this.payments.getByBooking(user.sub, bookingId);
  }

  /** To'lov holati. */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  status(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.getById(user.sub, id);
  }

  // ---------- Payme Merchant API (ochiq, Basic-auth) ----------

  @Post('payme')
  @ApiExcludeEndpoint()
  async paymeCallback(
    @Headers('authorization') auth: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.payme.checkAuth(auth)) {
      const err = invalidAuth();
      return {
        jsonrpc: '2.0',
        id: (body?.id as number | string | null) ?? null,
        error: { code: err.code, message: err.localized, data: err.data },
      };
    }
    return this.payme.handle(body);
  }

  // ---------- Click SHOP API (ochiq, imzo tekshiruvi ichida) ----------

  @Post('click/prepare')
  @ApiExcludeEndpoint()
  clickPrepare(@Body() body: Record<string, string>) {
    return this.click.prepare(body);
  }

  @Post('click/complete')
  @ApiExcludeEndpoint()
  clickComplete(@Body() body: Record<string, string>) {
    return this.click.complete(body);
  }
}
