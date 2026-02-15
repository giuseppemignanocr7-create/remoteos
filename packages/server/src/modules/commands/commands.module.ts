import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Command } from '../../entities/command.entity';
import { CommandProgress } from '../../entities/command-progress.entity';
import { CommandsService } from './commands.service';
import { CommandsController } from './commands.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Command, CommandProgress]),
    AuditModule,
    NotificationsModule,
    forwardRef(() => GatewayModule),
  ],
  controllers: [CommandsController],
  providers: [CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
