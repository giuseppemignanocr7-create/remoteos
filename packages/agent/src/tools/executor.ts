import { ProcessSupervisor } from '../supervisor';
import { TOOL_REGISTRY } from '@remoteos/shared';
import { runCommand } from './run-command';
import { gitStatus, gitPull, gitCommit } from './git';
import { getSystemStats, getProcesses, killProcess } from './system';
import { readFileContent, listFiles, writeFileContent, readLog } from './files';

export interface ToolResult {
  success: boolean;
  output: string;
  exitCode: number | null;
  errorCode?: string;
}

export class ToolExecutor {
  constructor(private readonly supervisor: ProcessSupervisor) {}

  async execute(action: string, params: Record<string, unknown>, timeoutMs: number, commandId?: string): Promise<ToolResult> {
    const meta = TOOL_REGISTRY[action];
    if (!meta) {
      return { success: false, output: `Unknown action: ${action}`, exitCode: 1, errorCode: 'UNKNOWN_ACTION' };
    }

    const effectiveTimeout = Math.min(timeoutMs, meta.max_timeout_ms);

    const paramsWithId = commandId ? { ...params, _command_id: commandId } : params;

    switch (action) {
      case 'run_command':
        return runCommand(paramsWithId, effectiveTimeout, this.supervisor);
      case 'git_status':
        return gitStatus(params);
      case 'git_pull':
        return gitPull(paramsWithId, effectiveTimeout, this.supervisor);
      case 'git_commit':
        return gitCommit(paramsWithId, effectiveTimeout, this.supervisor);
      case 'get_system_stats':
        return getSystemStats();
      case 'get_processes':
        return getProcesses();
      case 'kill_process':
        return killProcess(params);
      case 'read_file':
        return readFileContent(params);
      case 'read_log':
        return readLog(params);
      case 'write_file':
        return writeFileContent(params);
      case 'list_files':
        return listFiles(params);
      case 'get_task_status':
        return { success: true, output: JSON.stringify({ status: 'running' }), exitCode: 0 };
      case 'capture_screenshot':
        return { success: false, output: 'Screenshot not yet implemented', exitCode: 1, errorCode: 'NOT_IMPLEMENTED' };
      case 'list_windows':
        return { success: false, output: 'List windows not yet implemented', exitCode: 1, errorCode: 'NOT_IMPLEMENTED' };
      default:
        return { success: false, output: `Action ${action} not implemented yet`, exitCode: 1, errorCode: 'NOT_IMPLEMENTED' };
    }
  }

  cancel(commandId: string): boolean {
    return this.supervisor.kill(commandId);
  }
}
