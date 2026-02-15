// ─── Protocol ───

export const PROTOCOL_VERSION = '2.0';

// ─── Timeouts ───

export const DEFAULT_COMMAND_TIMEOUT_MS = 300_000;
export const MIN_COMMAND_TIMEOUT_MS = 1_000;
export const MAX_COMMAND_TIMEOUT_MS = 1_800_000;
export const DEFAULT_CONFIRM_TIMEOUT_MS = 60_000;
export const MAX_CONFIRM_TIMEOUT_MS = 600_000;

// ─── Agent ───

export const HEARTBEAT_INTERVAL_MS = 10_000;
export const HEARTBEAT_MISS_THRESHOLD = 3;
export const RECONNECT_DELAY_MS = 3_000;
export const MAX_RECONNECT_DELAY_MS = 30_000;

// ─── Output ───

export const MAX_OUTPUT_PREVIEW_LENGTH = 4_000;
export const MAX_CHUNK_SIZE = 64_000;

// ─── Rate Limiting ───

export const RATE_LIMIT_COMMANDS_PER_MINUTE = 30;
export const MAX_CONCURRENT_SESSIONS = 5;

// ─── Retry ───

export const DEFAULT_MAX_RETRIES = 1;
export const MAX_RETRIES_HARD_LIMIT = 10;
export const DEFAULT_BACKOFF_MS = 1_000;

// ─── JWT ───

export const JWT_ACCESS_TTL_SECONDS = 900;
export const JWT_REFRESH_TTL_SECONDS = 604_800;
