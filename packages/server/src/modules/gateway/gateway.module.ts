import { Module, forwardRef } from '@nestjs/common';
import { AgentGateway } from './agent.gateway';
import { CommandsModule } from '../commands/commands.module';
import { SessionsModule } from '../sessions/sessions.module';
import { DevicesModule } from '../devices/devices.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => CommandsModule), SessionsModule, DevicesModule, AuditModule, NotificationsModule],
  providers: [AgentGateway],
  exports: [AgentGateway],
})
export class GatewayModule {}
