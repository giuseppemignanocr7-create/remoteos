import { execSync } from 'child_process';
import { ProcessSupervisor } from '../supervisor';
import type { ToolResult } from './executor';
import { v4 as uuidv4 } from 'uuid';

export async function gitStatus(params: Record<string, unknown>): Promise<ToolResult> {
  const cwd = (params.cwd as string) || process.cwd();
  try {
    const output = execSync('git status --porcelain -b', { cwd, encoding: 'utf-8', timeout: 30000 });
    return { success: true, output, exitCode: 0 };
  } catch (err: any) {
    return { success: false, output: err.message, exitCode: 1, errorCode: 'GIT_ERROR' };
  }
}

export async function gitPull(
  params: Record<string, unknown>,
  timeoutMs: number,
  supervisor: ProcessSupervisor,
): Promise<ToolResult> {
  const cwd = (params.cwd as string) || process.cwd();
  const remote = (params.remote as string) || 'origin';
  const branch = (params.branch as string) || '';
  const cmd = branch ? `git pull ${remote} ${branch}` : `git pull ${remote}`;

  let stdout = '';
  let stderr = '';
  const result = await supervisor.spawn(
    uuidv4(), cmd, [], cwd, timeoutMs,
    (c) => { stdout += c; },
    (c) => { stderr += c; },
  );

  return {
    success: result.exitCode === 0,
    output: stdout + (stderr ? `\n${stderr}` : ''),
    exitCode: result.exitCode,
  };
}

export async function gitCommit(
  params: Record<string, unknown>,
  timeoutMs: number,
  supervisor: ProcessSupervisor,
): Promise<ToolResult> {
  const cwd = (params.cwd as string) || process.cwd();
  const message = (params.message as string) || 'Auto-commit from RemoteOps';
  const addAll = params.add_all !== false;

  let stdout = '';
  let stderr = '';

  if (addAll) {
    try {
      execSync('git add -A', { cwd, encoding: 'utf-8', timeout: 15000 });
    } catch (err: any) {
      return { success: false, output: `git add failed: ${err.message}`, exitCode: 1, errorCode: 'GIT_ADD_FAILED' };
    }
  }

  const safeMessage = message.replace(/[\\"`$!]/g, '\\$&');
  const result = await supervisor.spawn(
    uuidv4(), `git commit -m "${safeMessage}"`, [], cwd, timeoutMs,
    (c) => { stdout += c; },
    (c) => { stderr += c; },
  );

  return {
    success: result.exitCode === 0,
    output: stdout + (stderr ? `\n${stderr}` : ''),
    exitCode: result.exitCode,
  };
}
