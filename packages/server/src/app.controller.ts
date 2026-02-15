import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'RemoteOps Suite v2',
      version: '2.0.0',
      endpoints: {
        health: 'GET /health',
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          refresh: 'POST /auth/refresh',
          me: 'GET /auth/me',
        },
        devices: {
          create: 'POST /devices',
          list: 'GET /devices',
          revoke: 'DELETE /devices/:id',
        },
        sessions: {
          create: 'POST /sessions',
          list: 'GET /sessions',
          end: 'PATCH /sessions/:id/end',
        },
        commands: {
          create: 'POST /commands',
          get: 'GET /commands/:id',
          progress: 'GET /commands/:id/progress',
          confirm: 'PATCH /commands/:id/confirm',
          cancel: 'PATCH /commands/:id/cancel',
          bySession: 'GET /commands/session/:sessionId',
        },
        macros: {
          create: 'POST /macros',
          list: 'GET /macros',
          get: 'GET /macros/:id',
          execute: 'POST /macros/:id/execute',
          runStatus: 'GET /macros/runs/:runId',
        },
        notifications: {
          list: 'GET /notifications',
          markRead: 'PATCH /notifications/:id/read',
          markAllRead: 'PATCH /notifications/read-all',
        },
        audit: {
          timeline: 'GET /audit/timeline',
          verify: 'GET /audit/verify',
        },
        websocket: 'ws://localhost:3100/ws/agent',
      },
    };
  }
}
