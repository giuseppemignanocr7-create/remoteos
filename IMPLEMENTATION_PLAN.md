# RemoteOps Suite v2 - Implementation Plan

Stato: esecuzione guidata dopo revisione architetturale completa  
Data: 2026-02-14

---

## 1) Obiettivo

Implementare in modo incrementale le criticita emerse nella revisione di fondo:

1. Protocollo robusto (progress/confirm/versioning/idempotency)
2. Data model PostgreSQL completo (users/commands/notifications/audit append-only)
3. Macro engine tipizzato con preset versionati
4. Flussi operativi chiari (pairing/reconnect/update/fallback)
5. Sicurezza e guardrail enforceable

---

## 2) Deliverable gia prodotti (spec-first)

- `docs/REMOTEOPS_SUITE_V2.md`
- `specs/protocol/remoteops-message.schema.json`
- `specs/protocol/examples.json`
- `specs/db/remoteops_schema.sql`
- `specs/macros/macro.schema.json`
- `specs/macros/presets.json`

Questi file costituiscono la baseline contrattuale per lo sviluppo.

---

## 3) Piano implementativo per modulo

## 3.1 Server (NestJS)

### Sprint S1 - Foundation
- Bootstrap modulo `remoteops` (API + WS gateway)
- Caricamento schema protocol v2
- Validazione runtime messaggi in ingresso/uscita
- Endpoint health + readiness

### Sprint S2 - Command Broker
- Queue Redis persistente con ack/retry
- Stato comando (`pending -> sent -> running -> final`)
- Stream progress chunked
- Cancel path (`cancel_request` -> `cancel_result`)

### Sprint S3 - Confirm Engine
- Gestione `confirm_request/confirm_response`
- Timeout conferma e auto-deny policy
- Audit evento conferma con risk level

### Sprint S4 - Security
- 2FA TOTP + Passkey
- Session TTL + rotating refresh
- Rate limiting per device/session
- Policy engine (allowlist, readonly mode)

## 3.2 PC Agent (Windows Service)

### Sprint A1 - Core executor
- Tool runner deterministico
- Supervisor processi child
- Timeout hard per comando
- Heartbeat periodico

### Sprint A2 - Reliability
- Reconnect + state sync
- Idempotency handling lato agent
- Output chunking e upload artifacts

### Sprint A3 - Lifecycle
- Pairing enrollment flow
- Update auto con verifica firma + rollback
- Config locale/remota con merge precedence

## 3.3 Mobile (React Native)

### Sprint M1 - Operativita base
- Home device dashboard
- Chat command mode
- Quick actions configurabili

### Sprint M2 - Controllo task
- Vista task live (step/progress)
- Conferme ad alto rischio
- Cancel immediato

### Sprint M3 - Governance
- Timeline audit
- Notification center (critical/warning/info)
- Device management (revoke/switch)

---

## 4) Sequenza consigliata di realizzazione

1. Applicare `specs/db/remoteops_schema.sql` su ambiente dev
2. Implementare validazione protocollo server-side
3. Implementare broker + stati comando
4. Implementare agent command runner con heartbeat
5. Chiudere ciclo end-to-end: command -> progress -> result
6. Aggiungere conferme e cancellazione
7. Attivare guardrail e rate limiting
8. Introdurre macro engine + preset import
9. Solo dopo: desktop mode WebRTC

---

## 5) Acceptance criteria (bloccanti)

- [ ] Un comando produce almeno 1 `progress` e 1 `result`
- [ ] `confirm_request` blocca realmente l'esecuzione mutante fino a risposta
- [ ] `cancel_request` termina child process entro timeout policy
- [ ] Audit log non modificabile (`UPDATE/DELETE` bloccati)
- [ ] Hash chain audit verificabile su 100 record consecutivi
- [ ] Idempotency key evita doppia esecuzione
- [ ] Macro preset validano contro `macro.schema.json`

---

## 6) Rischi attivi e mitigazioni

1. **Race condition su comandi concorrenti**  
   Mitigazione: lock per `project_key` + scope policy

2. **Output eccessivo in memoria**  
   Mitigazione: chunk + truncation + artifact upload

3. **False offline per heartbeat intermittente**  
   Mitigazione: soglia N miss consecutivi prima di cambiare stato

4. **Conferme non risposte**  
   Mitigazione: auto-deny + notifica + audit reason

5. **Update agent fallito**  
   Mitigazione: swap atomico + rollback automatico

---

## 7) Next action immediate

1. Applicare DB schema in dev PostgreSQL
2. Generare types TS dal protocol schema
3. Stubbare gateway WS con i tipi `command/progress/result`
4. Implementare primo tool agent: `run_command`
5. Test E2E minimo: mobile mock -> server -> agent -> result

---

## 8) Definizione di done (fase MVP)

MVP e considerato done quando:
- Pairing device funzionante
- Command mode stabile con progress/cancel/confirm
- Guardrail attivi su azioni distruttive
- Audit completo e immutabile
- Macro base eseguibili (`fix_quick`, `deploy_safe`, `diagnostics`, `restart_dev`, `watchdog_project`)
