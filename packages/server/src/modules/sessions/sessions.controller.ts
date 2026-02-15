import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: { pc_device_id: string; mobile_device_id?: string; mode?: 'command' | 'desktop' }) {
    return this.sessionsService.create({ ...body, user_id: req.user.id });
  }

  @Get()
  async listActive(@Request() req: any) {
    return this.sessionsService.findActive(req.user.id);
  }

  @Patch(':id/end')
  async end(@Request() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    const session = await this.sessionsService.findById(id);
    if (session.user_id !== req.user.id) throw new ForbiddenException('Not your session');
    return this.sessionsService.end(id, body.reason);
  }
}
