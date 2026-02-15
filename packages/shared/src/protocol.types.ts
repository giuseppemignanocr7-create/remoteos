// ─── Protocol Message Types (derived from remoteops-message.schema.json) ───

import {
  CommandStatus,
  ConcurrencyScope,
  ConfirmPolicy,
  ProgressStatus,
  RiskLevel,
  SeverityLevel,
} from './enums';

// ─── Base ───

export interface BaseEnvelope {
  protocol_version: string;
  id: string;
  timestamp: string;
  source?: 'mobile' | 'server' | 'agent';
  target?: 'mobile' | 'server' | 'agent';
  trace_id?: string;
  nonce?: string;
  signature?: string;
}

export interface Artifact {
  type: 'screenshot' | 'log' | 'report' | 'output_chunk';
  url: string;
  content_type?: string;
  size_bytes?: number;
  checksum_sha256?: string;
}

// ─── Message Types ───

export type MessageType =
  | 'command'
  | 'progress'
  | 'result'
  | 'event'
  | 'confirm_request'
  | 'confirm_response'
  | 'cancel_request'
  | 'cancel_result';

// ─── Command ───

export interface CommandMessage extends BaseEnvelope {
  type: 'command';
  session_id: string;
  action: string;
  params: Record<string, unknown>;
  timeout_ms: number;
  idempotency_key: string;
  requires_confirm?: boolean;
  confirm_policy?: ConfirmPolicy;
  concurrency_scope?: ConcurrencyScope;
}

// ─── Progress ───

export interface ProgressMessage extends BaseEnvelope {
  type: 'progress';
  command_id: string;
  status: ProgressStatus;
  step?: number;
  total_steps?: number;
  percent?: number;
  message?: string;
  output_chunk?: string;
  chunk_index?: number;
  chunk_final?: boolean;
  artifacts?: Artifact[];
}

// ─── Result ───

export type ResultStatus =
  | 'success'
  | 'error'
  | 'timeout'
  | 'cancelled'
  | 'terminated'
  | 'agent_crashed';

export interface ResultMessage extends BaseEnvelope {
  type: 'result';
  command_id: string;
  status: ResultStatus;
  exit_code?: number | null;
  output?: string;
  output_bytes?: number;
  output_truncated?: boolean;
  duration_ms: number;
  error_code?: string;
  error_details?: Record<string, unknown>;
  attachments?: Artifact[];
}

// ─── Event ───

export type EventName =
  | 'agent_online'
  | 'agent_offline'
  | 'heartbeat_timeout'
  | 'process_crashed'
  | 'disk_warning'
  | 'cpu_warning'
  | 'build_complete'
  | 'session_started'
  | 'session_ended'
  | 'fallback_invoked';

export interface EventMessage extends BaseEnvelope {
  type: 'event';
  event: EventName;
  severity: SeverityLevel;
  data: Record<string, unknown>;
}

// ─── Confirm ───

export interface ConfirmRequestMessage extends BaseEnvelope {
  type: 'confirm_request';
  command_id: string;
  confirm_id: string;
  action: string;
  params?: Record<string, unknown>;
  message: string;
  risk_level: RiskLevel;
  timeout_ms: number;
}

export interface ConfirmResponseMessage extends BaseEnvelope {
  type: 'confirm_response';
  confirm_id: string;
  command_id?: string;
  approved: boolean;
  reason?: string;
}

// ─── Cancel ───

export interface CancelRequestMessage extends BaseEnvelope {
  type: 'cancel_request';
  command_id: string;
  requested_by: 'user' | 'system' | 'policy';
  reason?: string;
}

export type CancelResultStatus = 'cancelled' | 'not_found' | 'already_finished' | 'denied';

export interface CancelResultMessage extends BaseEnvelope {
  type: 'cancel_result';
  command_id: string;
  status: CancelResultStatus;
  message?: string;
}

// ─── Union ───

export type ProtocolMessage =
  | CommandMessage
  | ProgressMessage
  | ResultMessage
  | EventMessage
  | ConfirmRequestMessage
  | ConfirmResponseMessage
  | CancelRequestMessage
  | CancelResultMessage;
