import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { validate as isUuid } from 'uuid';
import { validateMessage } from '@remoteos/shared';
import { CommandsService } from '../commands/commands.service';
import { DevicesService } from '../devices/devices.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuditService } from '../audit/audit.service';
import type { ProtocolMessage } from '@remoteos/shared';

@WebSocketGateway({ namespace: '/ws/agent', cors: true })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AgentGateway.name);
  /** Maps device UUID (from DB) → socket. Falls back to fingerprint if device not registered. */
  private readonly agentSockets = new Map<string, Socket>();
  /** Maps socket.id → resolved device UUID (or raw fingerprint if unregistered). */
  private readonly socketToDevice = new Map<string, string>();
  /** Maps raw fingerprint → resolved device UUID for registered devices. */
  private readonly fingerprintToUuid = new Map<string, string>();

  constructor(
    private readonly commandsService: CommandsService,
    private readonly devicesService: DevicesService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
  ) {}

  async handleConnection(client: Socket) {
    const fingerprint = client.handshake.query.device_id as string;
    if (!fingerprint) return;

    try {
      const device = await this.devicesService.findByFingerprint(fingerprint);
      const key = device ? device.id : fingerprint;

      if (device) {
        this.fingerprintToUuid.set(fingerprint, device.id);
      }

      const existing = this.agentSockets.get(key);
      if (existing && existing.id !== client.id) {
        this.logger.warn(`Agent ${key} already connected, disconnecting old socket`);
        this.socketToDevice.delete(existing.id);
        existing.disconnect(true);
      }

      this.agentSockets.set(key, client);
      this.socketToDevice.set(client.id, key);

      if (device) {
        await this.devicesService.updateLastSeen(device.id);
      }
      this.logger.log(`Agent connected: fingerprint=${fingerprint} uuid=${device?.id ?? 'unregistered'}`);
    } catch (err: any) {
      this.logger.error(`Error resolving device on connect: ${err.message}`);
      this.agentSockets.set(fingerprint, client);
      this.socketToDevice.set(client.id, fingerprint);
    }
  }

  handleDisconnect(client: Socket) {
    const key = this.socketToDevice.get(client.id);
    if (key) {
      const current = this.agentSockets.get(key);
      if (current?.id === client.id) {
        this.agentSockets.delete(key);
        this.logger.log(`Agent disconnected: ${key}`);
      } else {
        this.logger.log(`Agent stale socket disconnected: ${key} (replaced by newer connection)`);
      }
      this.socketToDevice.delete(client.id);
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const key = this.socketToDevice.get(client.id);
    if (key) {
      if (isUuid(key)) {
        await this.devicesService.updateLastSeen(key).catch(() => {});
      }
      const sessionId = client.handshake.query.session_id as string;
      if (sessionId) {
        await this.sessionsService.heartbeat(sessionId).catch(() => {});
      }
    }
    return { event: 'heartbeat_ack', data: { ts: new Date().toISOString() } };
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: unknown, @ConnectedSocket() client: Socket) {
    const validation = validateMessage(data);
    if (!validation.valid) {
      this.logger.warn(`Invalid message from agent: ${validation.errors.join(', ')}`);
      client.emit('error', { errors: validation.errors });
      return;
    }

    const msg = data as ProtocolMessage;

    try {
      switch (msg.type) {
        case 'progress': {
          await this.commandsService.addProgress(msg.command_id, {
            status: msg.status,
            step: msg.step,
            total_steps: msg.total_steps,
            percent: msg.percent,
            message: msg.message,
            output_chunk: msg.output_chunk,
            chunk_index: msg.chunk_index,
            chunk_final: msg.chunk_final,
          });
          const progressToCommand: Record<string, string> = {
            running: 'running',
            sent: 'sent',
            queued: 'pending',
            retrying: 'retrying',
            awaiting_confirm: 'awaiting_confirm',
          };
          const mappedStatus = progressToCommand[msg.status];
          if (mappedStatus) {
            await this.commandsService.updateStatus(msg.command_id, mappedStatus);
          }
          this.server.emit(`progress:${msg.command_id}`, msg);
          break;
        }

        case 'result':
          await this.commandsService.updateStatus(msg.command_id, msg.status);
          this.server.emit(`result:${msg.command_id}`, msg);
          break;

        case 'event':
          this.server.emit('event', msg);
          break;

        case 'confirm_request':
          this.server.emit(`confirm:${msg.command_id}`, msg);
          break;

        case 'cancel_result':
          this.server.emit(`cancel_result:${msg.command_id}`, msg);
          break;

        default:
          this.logger.warn(`Unhandled message type: ${(msg as any).type}`);
      }
    } catch (err: any) {
      this.logger.error(`Error handling message type=${msg.type}: ${err.message}`, err.stack);
      client.emit('error', { message: err.message });
    }
  }

  sendToAgent(deviceId: string, message: ProtocolMessage): boolean {
    const socket = this.agentSockets.get(deviceId);
    if (!socket) {
      this.logger.warn(`Agent ${deviceId} not connected`);
      return false;
    }
    socket.emit('message', message);
    return true;
  }

  isAgentOnline(deviceId: string): boolean {
    return this.agentSockets.has(deviceId);
  }
}
