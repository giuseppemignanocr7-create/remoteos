-- RemoteOps Suite v2 - PostgreSQL schema
-- Requires PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Types
-- =========================

CREATE TYPE device_type AS ENUM ('mobile', 'pc');
CREATE TYPE session_mode AS ENUM ('command', 'desktop');

CREATE TYPE command_status AS ENUM (
  'pending',
  'sent',
  'running',
  'awaiting_confirm',
  'retrying',
  'success',
  'error',
  'timeout',
  'cancelled',
  'terminated',
  'agent_crashed'
);

CREATE TYPE progress_status AS ENUM (
  'queued',
  'sent',
  'running',
  'retrying',
  'awaiting_confirm',
  'cancelling'
);

CREATE TYPE severity_level AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE command_concurrency_scope AS ENUM ('none', 'project', 'global');
CREATE TYPE confirm_policy AS ENUM ('never', 'on_mutation', 'always');
CREATE TYPE macro_trigger_source AS ENUM ('manual', 'schedule', 'event');
CREATE TYPE macro_run_status AS ENUM ('running', 'success', 'error', 'cancelled', 'timeout');

-- =========================
-- Utility functions
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_mutation_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'append-only table: % does not allow % operations', TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE OR REPLACE FUNCTION set_audit_hash_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_prev_hash CHAR(64);
  v_payload TEXT;
BEGIN
  SELECT entry_hash
    INTO v_prev_hash
    FROM audit_log
   ORDER BY id DESC
   LIMIT 1;

  NEW.prev_hash := COALESCE(v_prev_hash, repeat('0', 64));

  v_payload := concat_ws(
    '|',
    NEW.created_at::TEXT,
    NEW.user_id::TEXT,
    COALESCE(NEW.device_id::TEXT, ''),
    COALESCE(NEW.pc_id::TEXT, ''),
    COALESCE(NEW.session_id::TEXT, ''),
    COALESCE(NEW.command_id::TEXT, ''),
    NEW.action,
    COALESCE(NEW.params_hash, ''),
    COALESCE(NEW.result::TEXT, ''),
    COALESCE(NEW.output_hash, ''),
    COALESCE(NEW.duration_ms::TEXT, ''),
    NEW.prev_hash
  );

  NEW.entry_hash := encode(digest(v_payload, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

-- =========================
-- Core entities
-- =========================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  totp_secret TEXT,
  passkey_credentials JSONB NOT NULL DEFAULT '[]'::JSONB,
  timezone VARCHAR(80) NOT NULL DEFAULT 'Europe/Rome',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type device_type NOT NULL,
  fingerprint VARCHAR(255) NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_seen TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile_device_id UUID REFERENCES devices(id),
  pc_device_id UUID NOT NULL REFERENCES devices(id),
  mode session_mode NOT NULL DEFAULT 'command',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  disconnect_reason VARCHAR(120),
  CONSTRAINT session_ended_after_start CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pc_device_id UUID NOT NULL REFERENCES devices(id),
  action VARCHAR(120) NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::JSONB,
  status command_status NOT NULL DEFAULT 'pending',
  requires_confirm BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_policy confirm_policy NOT NULL DEFAULT 'on_mutation',
  confirm_id UUID,
  confirmed_by_device_id UUID REFERENCES devices(id),
  confirmed_at TIMESTAMPTZ,
  timeout_ms INTEGER NOT NULL DEFAULT 300000,
  idempotency_key VARCHAR(128) NOT NULL,
  concurrency_scope command_concurrency_scope NOT NULL DEFAULT 'project',
  project_key VARCHAR(180),
  attempt_count SMALLINT NOT NULL DEFAULT 0,
  max_retries SMALLINT NOT NULL DEFAULT 1,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error_code VARCHAR(80),
  last_error_message TEXT,
  output_preview TEXT,
  output_bytes INTEGER NOT NULL DEFAULT 0,
  output_truncated BOOLEAN NOT NULL DEFAULT FALSE,
  artifact_manifest JSONB NOT NULL DEFAULT '[]'::JSONB,
  CONSTRAINT timeout_range CHECK (timeout_ms BETWEEN 1000 AND 1800000),
  CONSTRAINT command_timestamps_order CHECK (
    (started_at IS NULL OR started_at >= queued_at)
    AND (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at))
  ),
  CONSTRAINT command_confirm_consistency CHECK (
    (requires_confirm = FALSE AND confirm_id IS NULL AND confirmed_at IS NULL AND confirmed_by_device_id IS NULL)
    OR (requires_confirm = TRUE)
  ),
  CONSTRAINT command_confirm_actor_consistency CHECK (
    (confirmed_at IS NULL AND confirmed_by_device_id IS NULL)
    OR (confirmed_at IS NOT NULL AND confirmed_by_device_id IS NOT NULL)
  ),
  CONSTRAINT unique_idempotency_per_session UNIQUE (session_id, idempotency_key)
);

CREATE TABLE command_progress (
  id BIGSERIAL PRIMARY KEY,
  command_id UUID NOT NULL REFERENCES commands(id) ON DELETE CASCADE,
  status progress_status NOT NULL,
  step INTEGER,
  total_steps INTEGER,
  percent NUMERIC(5,2),
  message TEXT,
  output_chunk TEXT,
  chunk_index INTEGER,
  chunk_final BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT progress_step_positive CHECK (step IS NULL OR step > 0),
  CONSTRAINT progress_total_steps_positive CHECK (total_steps IS NULL OR total_steps > 0),
  CONSTRAINT progress_percent_range CHECK (percent IS NULL OR (percent >= 0 AND percent <= 100))
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  command_id UUID REFERENCES commands(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  severity severity_level NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT read_time_consistency CHECK (is_read = FALSE OR read_at IS NOT NULL)
);

CREATE TABLE macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  steps JSONB NOT NULL,
  requires_confirm BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  scope VARCHAR(20) NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT macro_scope_check CHECK (scope IN ('private', 'team', 'global')),
  CONSTRAINT macro_steps_array CHECK (jsonb_typeof(steps) = 'array'),
  CONSTRAINT unique_macro_name_per_user UNIQUE (user_id, name)
);

CREATE TABLE macro_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_id UUID NOT NULL REFERENCES macros(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  trigger_source macro_trigger_source NOT NULL DEFAULT 'manual',
  status macro_run_status NOT NULL DEFAULT 'running',
  params JSONB NOT NULL DEFAULT '{}'::JSONB,
  result_summary TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT macro_run_ended_after_start CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  pc_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  command_id UUID REFERENCES commands(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::JSONB,
  params_hash CHAR(64),
  result command_status,
  output_hash CHAR(64),
  duration_ms INTEGER,
  fallback_level VARCHAR(20),
  fallback_reason VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prev_hash CHAR(64),
  entry_hash CHAR(64) NOT NULL,
  signature TEXT,
  CONSTRAINT audit_duration_non_negative CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CONSTRAINT audit_fallback_level_check CHECK (
    fallback_level IS NULL OR fallback_level IN ('L1', 'L2', 'L3', 'desktop')
  )
);

-- =========================
-- Triggers
-- =========================

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER devices_set_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER macros_set_updated_at
BEFORE UPDATE ON macros
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER audit_log_set_hash_chain
BEFORE INSERT ON audit_log
FOR EACH ROW
EXECUTE FUNCTION set_audit_hash_chain();

CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_mutation_append_only();

CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_mutation_append_only();

-- =========================
-- Indexes
-- =========================

CREATE INDEX idx_devices_user_active
  ON devices(user_id)
  WHERE is_revoked = FALSE;

CREATE INDEX idx_sessions_active
  ON sessions(pc_device_id, started_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX idx_sessions_heartbeat
  ON sessions(last_heartbeat_at DESC);

CREATE INDEX idx_commands_status_queue
  ON commands(status, queued_at);

CREATE INDEX idx_commands_session
  ON commands(session_id, queued_at DESC);

CREATE INDEX idx_commands_project_scope
  ON commands(project_key, status)
  WHERE project_key IS NOT NULL;

CREATE INDEX idx_command_progress_command_created
  ON command_progress(command_id, created_at);

CREATE INDEX idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX idx_macros_user_active
  ON macros(user_id, is_active);

CREATE INDEX idx_macro_runs_user_started
  ON macro_runs(user_id, started_at DESC);

CREATE INDEX idx_audit_user_created
  ON audit_log(user_id, created_at DESC);

CREATE INDEX idx_audit_session_created
  ON audit_log(session_id, created_at DESC);

CREATE UNIQUE INDEX idx_audit_entry_hash_unique
  ON audit_log(entry_hash);

-- =========================
-- Notes
-- =========================

-- 1) commands.status lifecycle:
--    pending -> sent -> running -> (success|error|timeout|cancelled|terminated|agent_crashed)
-- 2) audit_log e append-only: UPDATE/DELETE bloccati da trigger.
-- 3) hash chain: prev_hash + payload -> entry_hash per verificabilita forense.
