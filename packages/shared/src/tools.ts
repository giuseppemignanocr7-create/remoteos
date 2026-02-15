// ─── Tool Registry (from dossier §5) ───

export interface ToolMeta {
  name: string;
  mutates_state: boolean;
  requires_confirm: boolean;
  allowed_in_readonly_mode: boolean;
  max_timeout_ms: number;
  concurrency_scope: 'none' | 'project' | 'global';
}

export const TOOL_REGISTRY: Record<string, ToolMeta> = {
  // Task lifecycle
  run_command: {
    name: 'run_command',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 600_000,
    concurrency_scope: 'project',
  },
  cancel_task: {
    name: 'cancel_task',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },
  get_task_status: {
    name: 'get_task_status',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 10_000,
    concurrency_scope: 'none',
  },

  // System/process
  get_processes: {
    name: 'get_processes',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },
  kill_process: {
    name: 'kill_process',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 30_000,
    concurrency_scope: 'global',
  },
  get_system_stats: {
    name: 'get_system_stats',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 15_000,
    concurrency_scope: 'none',
  },
  network_check: {
    name: 'network_check',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 15_000,
    concurrency_scope: 'none',
  },

  // Git/dev
  git_pull: {
    name: 'git_pull',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 300_000,
    concurrency_scope: 'project',
  },
  git_status: {
    name: 'git_status',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },
  git_commit: {
    name: 'git_commit',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 60_000,
    concurrency_scope: 'project',
  },
  run_build: {
    name: 'run_build',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 900_000,
    concurrency_scope: 'project',
  },
  run_tests: {
    name: 'run_tests',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 900_000,
    concurrency_scope: 'project',
  },
  start_dev_server: {
    name: 'start_dev_server',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 120_000,
    concurrency_scope: 'project',
  },
  stop_dev_server: {
    name: 'stop_dev_server',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 30_000,
    concurrency_scope: 'project',
  },

  // Files
  read_file: {
    name: 'read_file',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },
  read_log: {
    name: 'read_log',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },
  write_file: {
    name: 'write_file',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 60_000,
    concurrency_scope: 'project',
  },
  list_files: {
    name: 'list_files',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },

  // Config/env
  get_env_var: {
    name: 'get_env_var',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 10_000,
    concurrency_scope: 'none',
  },
  set_env_var: {
    name: 'set_env_var',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 10_000,
    concurrency_scope: 'global',
  },

  // Clipboard
  clipboard_get: {
    name: 'clipboard_get',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 5_000,
    concurrency_scope: 'none',
  },
  clipboard_set: {
    name: 'clipboard_set',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 5_000,
    concurrency_scope: 'none',
  },

  // Visual
  capture_screenshot: {
    name: 'capture_screenshot',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 30_000,
    concurrency_scope: 'none',
  },
  list_windows: {
    name: 'list_windows',
    mutates_state: false,
    requires_confirm: false,
    allowed_in_readonly_mode: true,
    max_timeout_ms: 10_000,
    concurrency_scope: 'none',
  },

  // Deploy
  deploy_vercel: {
    name: 'deploy_vercel',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 600_000,
    concurrency_scope: 'project',
  },
  deploy_supabase: {
    name: 'deploy_supabase',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 600_000,
    concurrency_scope: 'project',
  },

  // Desktop fallback
  open_desktop_session: {
    name: 'open_desktop_session',
    mutates_state: true,
    requires_confirm: true,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 60_000,
    concurrency_scope: 'global',
  },
  close_desktop_session: {
    name: 'close_desktop_session',
    mutates_state: true,
    requires_confirm: false,
    allowed_in_readonly_mode: false,
    max_timeout_ms: 30_000,
    concurrency_scope: 'global',
  },
};
