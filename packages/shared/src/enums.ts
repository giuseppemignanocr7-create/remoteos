// ─── DB Enums (mirror of remoteops_schema.sql) ───

export enum DeviceType {
  MOBILE = 'mobile',
  PC = 'pc',
}

export enum SessionMode {
  COMMAND = 'command',
  DESKTOP = 'desktop',
}

export enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RUNNING = 'running',
  AWAITING_CONFIRM = 'awaiting_confirm',
  RETRYING = 'retrying',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
  TERMINATED = 'terminated',
  AGENT_CRASHED = 'agent_crashed',
}

export const COMMAND_STATUS_FINAL = new Set<CommandStatus>([
  CommandStatus.SUCCESS,
  CommandStatus.ERROR,
  CommandStatus.TIMEOUT,
  CommandStatus.CANCELLED,
  CommandStatus.TERMINATED,
  CommandStatus.AGENT_CRASHED,
]);

export enum ProgressStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  RUNNING = 'running',
  RETRYING = 'retrying',
  AWAITING_CONFIRM = 'awaiting_confirm',
  CANCELLING = 'cancelling',
}

export enum SeverityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ConcurrencyScope {
  NONE = 'none',
  PROJECT = 'project',
  GLOBAL = 'global',
}

export enum ConfirmPolicy {
  NEVER = 'never',
  ON_MUTATION = 'on_mutation',
  ALWAYS = 'always',
}

export enum MacroTriggerSource {
  MANUAL = 'manual',
  SCHEDULE = 'schedule',
  EVENT = 'event',
}

export enum MacroRunStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FallbackLevel {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  DESKTOP = 'desktop',
}
