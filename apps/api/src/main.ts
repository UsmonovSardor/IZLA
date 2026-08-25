import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { env, assertProductionSafety } from './config/env';

async function bootstrap() {
  // Zaif/default sirlar bilan prod ishga tushishini bloklaydi
  assertProductionSafety();

  const app = await NestFactory.create(AppModule, { cors: false });

  // Railway/proxy orqasida haqiqiy mijoz IP'sini olish (rate-limit to'g'ri ishlashi uchun)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Xavfsizlik header'lari (helmet). API JSON qaytargani uchun CSP shart emas.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.enableCors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks(); // Railway SIGTERM'da Prisma toza uziladi

  // Swagger faqat prod bo'lmaganda (yoki aniq yoqilганda) ochiladi
  if (env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Izla.uz API')
      .setDescription('Izla.uz — xizmatlar super-platformasi backend (TZ v2.0)')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  // Railway/Docker PORT'ni hurmat qiladi, aks holda API_PORT
  const port = process.env.PORT ? Number(process.env.PORT) : env.API_PORT;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Izla API: :${port}`, 'Bootstrap');
}
bootstrap();
