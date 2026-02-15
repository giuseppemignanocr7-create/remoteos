# REMOTEOPS SUITE v2.0
## Dossier Definitivo (Revised) - UltraDivine Ecosystem

Versione: 2.0  
Data: Febbraio 2026  
Stato: Ready for implementation

---

## 1) Filosofia

> "Non muovi il mouse da remoto. Dai ordini a un robot che lavora per te."

**Command-first by design:**
- 90% operazioni in modalita comando (veloce, low bandwidth, auditabile)
- 10% operazioni in desktop mode (fallback operativo)

---

## 2) Architettura a 4 moduli (corretta)

```text
MOBILE APP <-> CONTROL PLANE (Server + CoreMind Orchestrator) <-> PC AGENT
                                |
                        Storage + Queue + Audit
```

### Moduli

1. **Mobile App (React Native)**
   - Dashboard device
   - Chat CoreMind
   - Quick actions configurabili
   - Task monitor (progress + cancel)
   - Desktop viewer

2. **Control Plane (NestJS + PostgreSQL + Redis)**
   - Auth + 2FA + session management
   - Device registry + pairing
   - Command broker + queue persistente
   - CoreMind orchestrator (intent parser + task planner)
   - Audit log append-only
   - Notification dispatcher

3. **PC Agent (Windows Service)**
   - Tool executor (command/file/process/git)
   - Process supervisor + timeout engine
   - Heartbeat/reconnect
   - Screenshot/log artifact uploader
   - Config loader (locale + remota)

4. **Infra Services**
   - Redis (queue + pub/sub)
   - Object storage (screenshot/log/report)
   - WireGuard + mTLS

### Correzione chiave

**CoreMind si posiziona nel Control Plane** (non sul PC) per:
- centralizzare orchestrazione e policy
- ridurre complessita dell'Agent
- versionare prompt/tooling in un solo punto

L'Agent resta un esecutore deterministico dei comandi strutturati.

---

## 3) Modalita operative

### A) COMMAND MODE (default)

Flusso:
1. User invia richiesta naturale
2. CoreMind converte in piano step-by-step
3. Server invia step all'Agent via queue
4. Agent esegue e streamma progress/output
5. Server invia risultato + audit + notifica

**Policy:** un task ha sempre `timeout_ms` e supporta `cancel_task`.

### B) DESKTOP MODE (fallback)

Attivazione:
- manuale utente
- automatica proposta dal planner quando CLI/API falliscono

Regole:
- sessione firmata, TTL breve
- auto-chiusura per inattivita (default 10 min)
- audit evento start/stop e ragione del fallback

### C) HYBRID HANDOFF (nuovo)

Il sistema puo passare da command a desktop durante lo stesso task:
- `fallback_reason`: `ui_required | non_automatable | repeated_failure`
- richiesta conferma utente prima dell'apertura stream

---

## 4) Livelli di automazione (con fallback chain)

1. **Livello 1 - CLI/Process** (preferito)
2. **Livello 2 - App Control/API/COM**
3. **Livello 3 - UI Automation** (ultima risorsa, con conferma)

### Fallback chain obbligatoria

```text
L1 -> (fail) -> L2 -> (fail) -> L3(conferma) -> (fail) -> Desktop Mode
```

Ogni transizione deve generare evento audit con motivazione.

---

## 5) Toolset RemoteOps v2

```ts
const remoteOpsTools = {
  // Task lifecycle
  run_command,
  cancel_task,
  get_task_status,

  // System/process
  get_processes,
  kill_process,
  get_system_stats,
  network_check,

  // Git/dev
  git_pull,
  git_status,
  git_commit,
  run_build,
  run_tests,
  start_dev_server,
  stop_dev_server,

  // Files
  read_file,
  read_log,
  write_file, // sempre policy-driven confirmation
  list_files,

  // Config/env
  get_env_var,
  set_env_var, // confirm required

  // Clipboard
  clipboard_get,
  clipboard_set,

  // Visual
  capture_screenshot,
  list_windows,

  // Deploy
  deploy_vercel,
  deploy_supabase,

  // Desktop fallback
  open_desktop_session,
  close_desktop_session,
};
```

### Policy per tool

Ogni tool ha metadati di sicurezza:
- `mutates_state: boolean`
- `requires_confirm: boolean`
- `allowed_in_readonly_mode: boolean`
- `max_timeout_ms`
- `concurrency_scope: global | project | none`

---

## 6) Macro engine v2 (JSON schema based)

Le macro sono definite in JSON validato (no YAML runtime).

Capacita:
- versioning
- parametri tipizzati
- retry/fallback/on_error policy
- trigger manual/schedule/event
- conferma selettiva per step

Esempi preset inclusi:
- `fix_quick`
- `deploy_safe`
- `diagnostics`
- `restart_dev`
- `watchdog_project` (nuovo)

---

## 7) Sicurezza (hard requirements)

### Auth
- 2FA obbligatoria (TOTP + Passkey support)
- token breve (15 min)
- refresh rotating
- revoke immediato device/sessione

### Rete
- WireGuard preferito
- mTLS Agent <-> Server
- nonce anti-replay su payload firmati

### Guardrail
- allowlist comandi (default deny)
- blocklist path sensibili
- conferma obbligatoria per azioni distruttive
- timeout hard per task
- remote cancel sempre disponibile
- readonly mode
- sandbox per script non trusted

### Protezioni aggiuntive (nuove)
- rate limiting per device/sessione
- limite sessioni concorrenti
- lockout temporaneo su error burst
- opzionale IP allowlist

---

## 8) Audit log immutabile

Modello richiesto:
- append-only enforcement DB (trigger no update/delete)
- hash chain (`prev_hash`, `entry_hash`)
- firma opzionale lato Agent per eventi sensibili

Campi minimi:
- timestamp
- user/device/pc/session
- action + params_hash
- result + duration
- output_hash
- fallback_level / reason

---

## 9) Protocollo messaggi v2

Tipi supportati:
- `command`
- `progress` (nuovo)
- `result`
- `event`
- `confirm_request` (nuovo)
- `confirm_response` (nuovo)
- `cancel_request`
- `cancel_result`

Regole:
- ogni messaggio include `protocol_version`
- output grandi: streaming chunked o artifact URL
- idempotency key su comandi

Schema completo: vedi `specs/protocol/remoteops-message.schema.json`

---

## 10) Data model PostgreSQL v2

Tabelle minime:
- `users`
- `devices`
- `sessions`
- `commands`
- `command_progress`
- `audit_log`
- `notifications`
- `macros`
- `macro_runs`

Migliorie applicate:
- enum PostgreSQL corretti (`CREATE TYPE ... AS ENUM`)
- indici per query critiche
- vincoli integrita
- trigger append-only audit

Schema completo: vedi `specs/db/remoteops_schema.sql`

---

## 11) Storage artifacts

Artifact gestiti:
- screenshot
- log chunk
- report html/pdf

Policy:
- upload async a object storage
- retention default 7 giorni
- cleanup batch giornaliero

---

## 12) Concurrency e scheduling

Regole:
- task mutanti stesso progetto: serializzati
- task read-only: paralleli
- kill/cancel: priorita alta, fuori coda

Scheduling:
- macro con trigger time-based e event-based
- timezone esplicito (`Europe/Rome` default utente)

---

## 13) Flussi end-to-end (nuovi)

### Pairing
1. Agent genera keypair + fingerprint
2. Agent richiede enrollment al server
3. Mobile scansiona QR enrollment
4. Server lega user-mobile-pc
5. provisioning mTLS/WireGuard
6. heartbeat online

### Reconnect
1. heartbeat perso -> stato offline
2. queue conserva task pending
3. reconnect -> state sync
4. stale sessions chiuse automaticamente

### Update Agent
1. check versione
2. download binario firmato
3. verifica firma
4. swap atomico + restart service
5. rollback automatico se health fail

### Errore critico
1. timeout hard raggiunto
2. supervisor termina child process
3. result = timeout/terminated
4. audit + push alert

---

## 14) UX mobile v2

Schermate:
- Home dashboard
- Chat CoreMind
- Task in corso (nuova)
- Devices management (nuova)
- Desktop mode
- Audit timeline

Migliorie:
- quick actions configurabili
- progress per step + percent
- cancel prominente
- livelli notifica (critical/warn/info)

---

## 15) Stack tecnologico consigliato (MVP pragmatico)

- Server: NestJS + PostgreSQL + Redis
- Mobile: React Native
- Agent: **Go o Node packaging** per velocita MVP
- Streaming: WebRTC (fase 3)
- VPN: WireGuard

Nota: Rust resta opzione valida per hardening successivo, ma non blocca MVP.

---

## 16) Roadmap realistica (single team piccolo)

### Fase 0 (1 settimana) - Foundation
- monorepo
- protocol types/schema
- db migrations base
- auth base

### Fase 1 (2 settimane) - Agent Core + Broker
- windows service
- command executor
- heartbeat/reconnect
- queue + status

### Fase 2 (2 settimane) - Mobile MVP
- chat + quick actions
- task monitor
- pairing base

### Fase 3 (1 settimana) - Security hardening
- 2FA
- device binding
- guardrail + readonly
- mTLS/WireGuard

### Fase 4 (2 settimane) - Macro & Dev workflows
- macro engine
- preset
- report/log parser

### Fase 5 (2-3 settimane) - Desktop mode
- WebRTC
- remote input
- secure session control

Totale stimato: **10-11 settimane**.

---

## 17) Checklist pre-implementazione (bloccanti)

- [ ] Protocol schema v2 approvato
- [ ] DB schema v2 approvato
- [ ] Policy guardrail approvate
- [ ] Flussi pairing/reconnect/update approvati
- [ ] Concurrency policy approvata
- [ ] Retention policy artifacts approvata

---

## 18) Deliverable pronti in workspace

- `docs/REMOTEOPS_SUITE_V2.md`
- `specs/protocol/remoteops-message.schema.json`
- `specs/protocol/examples.json`
- `specs/db/remoteops_schema.sql`
- `specs/macros/macro.schema.json`
- `specs/macros/presets.json`
- `IMPLEMENTATION_PLAN.md`

---

## 19) Decisione OS (finale)

**Windows 11 Pro consigliato**:
- RDP host nativo come backup operativo
- Group Policy / BitLocker / Hyper-V
- migliore base per hardening enterprise

Home solo se uso personale minimo e senza requisiti fallback/sandbox avanzati.

---

## 20) Tracciabilita implementazione v2

Per evitare ambiguita, questo dossier e accompagnato da specifiche formali:

- Protocollo messaggi: `specs/protocol/remoteops-message.schema.json`
- Esempi protocollo: `specs/protocol/examples.json`
- Schema database: `specs/db/remoteops_schema.sql`
- Schema macro: `specs/macros/macro.schema.json`
- Preset macro: `specs/macros/presets.json`
- Piano operativo: `IMPLEMENTATION_PLAN.md`

Questi file rappresentano la base contrattuale per implementare agent, server e mobile senza divergenze.
