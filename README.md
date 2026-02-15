# RemoteOps Suite v2

> "Non muovi il mouse da remoto. Dai ordini a un robot che lavora per te."

Monorepo per la suite RemoteOps — piattaforma command-first per il controllo remoto di PC Windows.

## Architettura

```
Mobile App (React Native) <-> Control Plane (NestJS) <-> PC Agent (Node.js)
                                    |
                          PostgreSQL + Redis
```

## Struttura monorepo

```
packages/
├── shared/     # Tipi TS, costanti, validazione protocollo (Ajv)
├── server/     # NestJS Control Plane (API REST + WebSocket Gateway)
├── agent/      # Node.js PC Agent (tool executor, supervisor, heartbeat)
└── mobile/     # React Native app (TODO - Fase 3)
```

## Quick Start

### Prerequisiti

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### Setup

```bash
# 1. Clona e installa
pnpm install

# 2. Copia env
cp .env.example .env

# 3. Avvia PostgreSQL + Redis
docker compose up -d

# 4. Avvia server (dev mode)
pnpm dev:server

# 5. Avvia agent (in un altro terminale)
pnpm dev:agent
```

### Comandi utili

| Comando | Descrizione |
|---|---|
| `pnpm build` | Build tutti i package |
| `pnpm dev:server` | Server in watch mode |
| `pnpm dev:agent` | Agent in dev mode |
| `pnpm db:up` | Start PostgreSQL + Redis |
| `pnpm db:down` | Stop containers |

## API Endpoints (Server)

| Metodo | Path | Descrizione |
|---|---|---|
| `POST` | `/auth/register` | Registrazione utente |
| `POST` | `/auth/login` | Login → JWT token pair |
| `GET` | `/auth/me` | Profilo utente corrente |
| `POST` | `/devices` | Registra device |
| `GET` | `/devices` | Lista device utente |
| `DELETE` | `/devices/:id` | Revoca device |
| `POST` | `/sessions` | Crea sessione |
| `GET` | `/sessions` | Sessioni attive |
| `PATCH` | `/sessions/:id/end` | Chiudi sessione |
| `POST` | `/commands` | Invia comando |
| `GET` | `/commands/:id` | Stato comando |
| `GET` | `/commands/:id/progress` | Progress entries |
| `PATCH` | `/commands/:id/confirm` | Conferma/nega comando |
| `PATCH` | `/commands/:id/cancel` | Cancella comando |
| `POST` | `/macros` | Crea macro |
| `GET` | `/macros` | Lista macro |
| `POST` | `/macros/:id/execute` | Esegui macro |
| `GET` | `/audit/timeline` | Timeline audit |
| `GET` | `/audit/verify` | Verifica hash chain |
| `GET` | `/notifications` | Lista notifiche |
| `GET` | `/health` | Health check |

## WebSocket (Agent)

Namespace: `/ws/agent`

| Evento | Direzione | Descrizione |
|---|---|---|
| `message` | bidirezionale | Messaggi protocollo v2 |
| `heartbeat` | Agent → Server | Keep-alive periodico |
| `heartbeat_ack` | Server → Agent | Conferma heartbeat |

## Protocollo v2

8 tipi di messaggio: `command`, `progress`, `result`, `event`, `confirm_request`, `confirm_response`, `cancel_request`, `cancel_result`.

Schema completo: `specs/protocol/remoteops-message.schema.json`

## Tool Agent supportati

`run_command`, `git_status`, `git_pull`, `git_commit`, `get_system_stats`, `get_processes`, `kill_process`, `read_file`, `read_log`, `write_file`, `list_files`, `capture_screenshot` (stub), `list_windows` (stub)

## Specifiche

- **Dossier**: `docs/REMOTEOPS_SUITE_V2.md`
- **Protocol Schema**: `specs/protocol/remoteops-message.schema.json`
- **Protocol Examples**: `specs/protocol/examples.json`
- **DB Schema**: `specs/db/remoteops_schema.sql`
- **Macro Schema**: `specs/macros/macro.schema.json`
- **Macro Presets**: `specs/macros/presets.json`
- **Implementation Plan**: `IMPLEMENTATION_PLAN.md`

## Licenza

Proprietario — UltraDivine Ecosystem
