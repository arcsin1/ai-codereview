import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './modules/webhook/webhook.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { HealthModule } from './modules/health/health.module';
import { ReportModule } from './modules/report/report.module';
import { ReviewModule } from './modules/review/review.module';
import { LlmModule } from './modules/llm/llm.module';
import { NotificationModule } from './modules/notification/notification.module';
import { GitConfigModule } from './modules/git-config/git-config.module';
import { WinstonLoggerMiddleware, DevWinstonLoggerMiddleware } from './common/middlewares';
import { LoggerService } from './common/services';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // max 100 requests per ttl
      },
    ]),
    AuthModule,
    WebhookModule,
    ProjectModule,
    HealthModule,
    ReportModule,
    ReviewModule,
    LlmModule,
    NotificationModule,
    GitConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [LoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Select log middleware based on NODE_ENV environment variable
    const isDevelopment = process.env.NODE_ENV === 'development';

    consumer
      .apply(isDevelopment ? DevWinstonLoggerMiddleware : WinstonLoggerMiddleware)
      .forRoutes('*');
  }
}
