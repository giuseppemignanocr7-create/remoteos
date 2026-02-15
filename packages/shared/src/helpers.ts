// ─── Shared Helpers ───

import { v4 as uuidv4 } from 'uuid';
import { PROTOCOL_VERSION } from './constants';
import type { BaseEnvelope } from './protocol.types';

export function createEnvelope(
  source: 'mobile' | 'server' | 'agent',
  target: 'mobile' | 'server' | 'agent',
  traceId?: string,
): BaseEnvelope {
  return {
    protocol_version: PROTOCOL_VERSION,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    source,
    target,
    trace_id: traceId ?? uuidv4(),
  };
}

export function generateIdempotencyKey(action: string, scope: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${action}-${scope}-${ts}`;
}

export function truncateOutput(output: string, maxLength: number): { text: string; truncated: boolean } {
  if (output.length <= maxLength) {
    return { text: output, truncated: false };
  }
  return {
    text: output.slice(0, maxLength) + '\n... [truncated]',
    truncated: true,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function backoffDelay(attempt: number, baseMs: number, maxMs: number): number {
  const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  const jitter = delay * 0.1 * Math.random();
  return Math.round(delay + jitter);
}
