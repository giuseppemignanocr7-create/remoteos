import { Controller, Get, Patch, Param, Query, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Request() req: any, @Query('unread') unread?: string) {
    return this.notificationsService.findByUser(req.user.id, unread === 'true');
  }

  @Patch('read-all')
  async markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  async markRead(@Request() req: any, @Param('id') id: string) {
    const notif = await this.notificationsService.findById(id);
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.user_id !== req.user.id) throw new ForbiddenException('Not your notification');
    return this.notificationsService.markRead(id);
  }
}
