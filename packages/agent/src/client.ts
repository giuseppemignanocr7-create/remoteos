import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import {
  PROTOCOL_VERSION,
  createEnvelope,
  backoffDelay,
  RECONNECT_DELAY_MS,
  MAX_RECONNECT_DELAY_MS,
} from '@remoteos/shared';
import type {
  CommandMessage,
  ProgressMessage,
  ResultMessage,
  CancelRequestMessage,
  ConfirmResponseMessage,
  ProtocolMessage,
} from '@remoteos/shared';
import { ToolExecutor } from './tools/executor';

export class AgentClient {
  private socket: Socket | null = null;
  private reconnectAttempt = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly processedKeys = new Set<string>();
  private static readonly MAX_PROCESSED_KEYS = 10_000;

  constructor(
    private readonly serverUrl: string,
    private readonly deviceId: string,
    private readonly heartbeatMs: number,
    private readonly executor: ToolExecutor,
  ) {}

  connect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(`${this.serverUrl}/ws/agent`, {
      query: { device_id: this.deviceId },
      transports: ['websocket'],
      reconnection: false,
    });

    this.socket.on('connect', () => {
      console.log('[Agent] Connected to server');
      this.reconnectAttempt = 0;
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log(`[Agent] Disconnected: ${reason}`);
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error(`[Agent] Connection error: ${err.message}`);
      this.scheduleReconnect();
    });

    this.socket.on('message', (data: unknown) => {
      this.handleMessage(data as ProtocolMessage);
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.socket?.emit('heartbeat', { device_id: this.deviceId, ts: new Date().toISOString() });
    }, this.heartbeatMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    const delay = backoffDelay(this.reconnectAttempt, RECONNECT_DELAY_MS, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt++;
    console.log(`[Agent] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})...`);
    setTimeout(() => this.connect(), delay);
  }

  private async handleMessage(msg: ProtocolMessage): Promise<void> {
    switch (msg.type) {
      case 'command':
        await this.handleCommand(msg);
        break;
      case 'cancel_request':
        await this.handleCancel(msg);
        break;
      default:
        console.log(`[Agent] Ignoring message type: ${msg.type}`);
    }
  }

  private async handleCommand(cmd: CommandMessage): Promise<void> {
    if (this.processedKeys.has(cmd.idempotency_key)) {
      console.log(`[Agent] Duplicate idempotency_key, skipping: ${cmd.idempotency_key}`);
      return;
    }
    this.processedKeys.add(cmd.idempotency_key);
    if (this.processedKeys.size > AgentClient.MAX_PROCESSED_KEYS) {
      const first = this.processedKeys.values().next().value;
      if (first) this.processedKeys.delete(first);
    }

    this.sendProgress(cmd.id, 'running', 0, 'Executing...');

    try {
      const startTime = Date.now();
      const result = await this.executor.execute(cmd.action, cmd.params, cmd.timeout_ms, cmd.id);
      const duration = Date.now() - startTime;

      this.sendResult(cmd.id, result.success ? 'success' : 'error', result.output, result.exitCode, duration, result.errorCode);
    } catch (err: any) {
      this.sendResult(cmd.id, 'error', err.message, 1, 0, 'EXECUTION_ERROR');
    }
  }

  private async handleCancel(msg: CancelRequestMessage): Promise<void> {
    const killed = this.executor.cancel(msg.command_id);
    const envelope = createEnvelope('agent', 'server', msg.trace_id);
    this.socket?.emit('message', {
      ...envelope,
      type: 'cancel_result',
      command_id: msg.command_id,
      status: killed ? 'cancelled' : 'not_found',
      message: killed ? 'Process terminated' : 'Command not found or already finished',
    });
  }

  private sendProgress(commandId: string, status: string, percent: number, message: string): void {
    const envelope = createEnvelope('agent', 'server');
    const progress: ProgressMessage = {
      ...envelope,
      type: 'progress',
      command_id: commandId,
      status: status as any,
      percent,
      message,
    };
    this.socket?.emit('message', progress);
  }

  private sendResult(
    commandId: string,
    status: string,
    output: string,
    exitCode: number | null,
    durationMs: number,
    errorCode?: string,
  ): void {
    const envelope = createEnvelope('agent', 'server');
    const result: ResultMessage = {
      ...envelope,
      type: 'result',
      command_id: commandId,
      status: status as any,
      exit_code: exitCode,
      output: output.slice(0, 4000),
      output_bytes: output.length,
      output_truncated: output.length > 4000,
      duration_ms: durationMs,
      ...(errorCode ? { error_code: errorCode } : {}),
    };
    this.socket?.emit('message', result);
  }
}
