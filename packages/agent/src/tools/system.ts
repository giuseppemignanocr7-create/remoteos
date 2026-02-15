import { execSync } from 'child_process';
import * as os from 'os';
import type { ToolResult } from './executor';

export async function getSystemStats(): Promise<ToolResult> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const stats = {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime_seconds: os.uptime(),
    cpu_count: cpus.length,
    cpu_model: cpus[0]?.model || 'unknown',
    memory: {
      total_mb: Math.round(totalMem / 1024 / 1024),
      used_mb: Math.round(usedMem / 1024 / 1024),
      free_mb: Math.round(freeMem / 1024 / 1024),
      percent_used: Math.round((usedMem / totalMem) * 100),
    },
    load_average: os.loadavg(),
  };

  return { success: true, output: JSON.stringify(stats, null, 2), exitCode: 0 };
}

export async function getProcesses(): Promise<ToolResult> {
  try {
    let output: string;
    if (process.platform === 'win32') {
      output = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8', timeout: 30000 });
    } else {
      output = execSync('ps aux --sort=-%mem | head -50', { encoding: 'utf-8', timeout: 30000 });
    }
    return { success: true, output, exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: err.message, exitCode: 1, errorCode: 'PROCESS_LIST_ERROR' };
  }
}

export async function killProcess(params: Record<string, unknown>): Promise<ToolResult> {
  const pid = params.pid as number;
  if (!pid) {
    return { success: false, output: 'Missing "pid" parameter', exitCode: 1, errorCode: 'MISSING_PARAM' };
  }

  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F /T`, { encoding: 'utf-8', timeout: 10000 });
    } else {
      process.kill(pid, 'SIGKILL');
    }
    return { success: true, output: `Process ${pid} killed`, exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: `Failed to kill ${pid}: ${err.message}`, exitCode: 1, errorCode: 'KILL_FAILED' };
  }
}
