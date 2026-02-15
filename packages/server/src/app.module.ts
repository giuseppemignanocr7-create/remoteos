import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { CommandsModule } from './modules/commands/commands.module';
import { AuditModule } from './modules/audit/audit.module';
import { MacrosModule } from './modules/macros/macros.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { HealthModule } from './modules/health/health.module';
import { dataSourceOptions } from './database/data-source';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    DevicesModule,
    SessionsModule,
    CommandsModule,
    AuditModule,
    MacrosModule,
    NotificationsModule,
    GatewayModule,
    HealthModule,
  ],
})
export class AppModule {}
