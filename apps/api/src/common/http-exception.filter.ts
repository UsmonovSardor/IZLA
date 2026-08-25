import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@izla/db';
import type { Request, Response } from 'express';

/**
 * Yagona xato chegarasi — barcha xatolarni izchil JSON shaklga keltiradi:
 *   { status:'error', code, message, path, ts, requestId? }
 * Prod'da 5xx'lar uchun ichki tafsilot/stack SIZIB CHIQMAYDI.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');
  private readonly isProd = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Ichki server xatosi';

    if (exception instanceof HttpException) {
      code = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma xatolarini xavfsiz HTTP kodlarga xaritalash (ichki SQL oshkor qilinmaydi)
      if (exception.code === 'P2002') {
        code = HttpStatus.CONFLICT;
        message = 'Bunday yozuv allaqachon mavjud';
      } else if (exception.code === 'P2025') {
        code = HttpStatus.NOT_FOUND;
        message = 'Yozuv topilmadi';
      } else {
        code = HttpStatus.BAD_REQUEST;
        message = "Ma'lumotlar bazasi so‘rovi rad etildi";
      }
    }

    if (code >= 500) {
      // Faqat serverda to'liq log; mijozga umumiy xabar
      this.logger.error(
        `${req.method} ${req.url} → ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      if (this.isProd) message = 'Ichki server xatosi';
    }

    res.status(code).json({
      status: 'error',
      code,
      message,
      path: req.url,
      ts: new Date().toISOString(),
    });
  }
}
