import { ChildProcess, spawn } from 'child_process';

export interface ManagedProcess {
  commandId: string;
  process: ChildProcess;
  startedAt: Date;
  timeoutMs: number;
  timer: ReturnType<typeof setTimeout>;
}

export class ProcessSupervisor {
  private readonly processes = new Map<string, ManagedProcess>();

  spawn(
    commandId: string,
    command: string,
    args: string[],
    cwd: string,
    timeoutMs: number,
    onStdout: (chunk: string) => void,
    onStderr: (chunk: string) => void,
  ): Promise<{ exitCode: number | null; killed: boolean }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        shell: true,
        windowsHide: true,
        env: process.env,
      });

      const timer = setTimeout(() => {
        console.log(`[Supervisor] Timeout for command ${commandId}, killing...`);
        this.kill(commandId);
      }, timeoutMs);

      const managed: ManagedProcess = {
        commandId,
        process: child,
        startedAt: new Date(),
        timeoutMs,
        timer,
      };
      this.processes.set(commandId, managed);

      child.stdout?.on('data', (data: Buffer) => onStdout(data.toString()));
      child.stderr?.on('data', (data: Buffer) => onStderr(data.toString()));

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        this.processes.delete(commandId);
        resolve({ exitCode: code, killed: signal !== null });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        this.processes.delete(commandId);
        resolve({ exitCode: 1, killed: false });
      });
    });
  }

  kill(commandId: string): boolean {
    const managed = this.processes.get(commandId);
    if (!managed) return false;

    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(managed.process.pid), '/f', '/t']);
      } else {
        managed.process.kill('SIGKILL');
      }
    } catch {
      // Process may already be dead
    }

    clearTimeout(managed.timer);
    this.processes.delete(commandId);
    return true;
  }

  killAll(): void {
    for (const [id] of this.processes) {
      this.kill(id);
    }
  }

  isRunning(commandId: string): boolean {
    return this.processes.has(commandId);
  }
}
