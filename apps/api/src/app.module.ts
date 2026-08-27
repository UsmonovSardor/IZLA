import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { KabinetModule } from './modules/kabinet/kabinet.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ResumeModule } from './modules/resume/resume.module';
import { EmployerModule } from './modules/employer/employer.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Strukturaviy log: prod'da JSON (log-agregator uchun), dev'da pretty. Maxfiy maydonlar redakt.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'req.body.password',
            'req.body.code',
            'req.body.refreshToken',
          ],
          remove: true,
        },
        // Health-check shovqinini kamaytirish
        autoLogging: { ignore: (req) => req.url === '/health' },
        customProps: () => ({ context: 'HTTP' }),
      },
    }),
    // Global rate-limit: IP boshiga 60s'da 120 so'rov (webhook'lar @SkipThrottle bilan chiqarilgan)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    VendorsModule,
    PropertiesModule,
    BookingsModule,
    PaymentsModule,
    TelegramModule,
    AssistantModule,
    KabinetModule,
    JobsModule,
    ResumeModule,
    EmployerModule,
    FavoritesModule,
    ReviewsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
