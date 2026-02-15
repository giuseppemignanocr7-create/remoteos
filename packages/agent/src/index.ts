import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

import { AgentClient } from './client';
import { ToolExecutor } from './tools/executor';
import { ProcessSupervisor } from './supervisor';

const SERVER_URL = process.env.AGENT_SERVER_URL || 'ws://localhost:3100';
const DEVICE_ID = process.env.AGENT_DEVICE_ID || 'agent-dev-001';
const HEARTBEAT_MS = parseInt(process.env.AGENT_HEARTBEAT_INTERVAL_MS || '10000', 10);

async function main() {
  console.log(`[RemoteOps Agent] Starting...`);
  console.log(`  Server: ${SERVER_URL}`);
  console.log(`  Device: ${DEVICE_ID}`);

  const supervisor = new ProcessSupervisor();
  const executor = new ToolExecutor(supervisor);
  const client = new AgentClient(SERVER_URL, DEVICE_ID, HEARTBEAT_MS, executor);

  process.on('SIGINT', () => {
    console.log('[Agent] Shutting down...');
    client.disconnect();
    supervisor.killAll();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    client.disconnect();
    supervisor.killAll();
    process.exit(0);
  });

  client.connect();
}

main().catch((err) => {
  console.error('[Agent] Fatal error:', err);
  process.exit(1);
});
