import { ProcessSupervisor } from '../supervisor';
import type { ToolResult } from './executor';
import { v4 as uuidv4 } from 'uuid';

export async function runCommand(
  params: Record<string, unknown>,
  timeoutMs: number,
  supervisor: ProcessSupervisor,
): Promise<ToolResult> {
  const command = (params.command as string) || '';
  const cwd = (params.cwd as string) || process.cwd();
  const commandId = (params._command_id as string) || uuidv4();

  if (!command) {
    return { success: false, output: 'Missing "command" parameter', exitCode: 1, errorCode: 'MISSING_PARAM' };
  }

  const MAX_OUTPUT = 512_000;
  let stdout = '';
  let stderr = '';
  let truncated = false;

  const result = await supervisor.spawn(
    commandId,
    command,
    [],
    cwd,
    timeoutMs,
    (chunk) => {
      if (stdout.length < MAX_OUTPUT) stdout += chunk;
      else truncated = true;
    },
    (chunk) => {
      if (stderr.length < MAX_OUTPUT) stderr += chunk;
      else truncated = true;
    },
  );

  let output = stdout + (stderr ? `\n[stderr]\n${stderr}` : '');
  if (truncated) output += '\n... [output truncated at 512KB]';

  if (result.killed) {
    return { success: false, output: output || 'Process was killed (timeout)', exitCode: null, errorCode: 'TIMEOUT' };
  }

  return {
    success: result.exitCode === 0,
    output,
    exitCode: result.exitCode,
    ...(result.exitCode !== 0 ? { errorCode: 'NON_ZERO_EXIT' } : {}),
  };
}
