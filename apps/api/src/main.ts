import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.enableCors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Izla.uz API')
    .setDescription('Izla.uz — xizmatlar super-platformasi backend (TZ v2.0)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  // Railway/Docker PORT'ni hurmat qiladi, aks holda API_PORT
  const port = process.env.PORT ? Number(process.env.PORT) : env.API_PORT;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Izla API: :${port} — Swagger: /docs`, 'Bootstrap');
}
bootstrap();
